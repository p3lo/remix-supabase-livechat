import React from 'react';

import type { ActionArgs, LinksFunction, LoaderArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useActionData, useLoaderData } from '@remix-run/react';
import { useDataRefresh, useEventSource } from 'remix-utils';
import invariant from 'tiny-invariant';

import { db } from '~/database';
import { getAuthSession } from '~/modules/auth';
import { chatEmitter } from '~/modules/chat/emitter.server';
import { getAccessToken, getRoom } from '~/modules/livekit';
import { Streamer } from '~/modules/livekit/components/Streamer';
import { Viewer } from '~/modules/livekit/components/Viewer';
import { makeNick } from '~/modules/user';
import { LIVEKIT_SERVER } from '~/utils';

export async function loader({ request, params }: LoaderArgs) {
  const session = await getAuthSession(request);
  const roomName = params.room_id;
  invariant(roomName, 'Room name is required');
  const room = await getRoom(roomName);
  let user: { id: string; nickname: string; role: string } | null = null;
  if (!session && room.length === 0) return redirect('/');
  if (room.length === 0) {
    if (session) {
      user = await db.user.findUnique({
        where: {
          id: session.userId,
        },
        select: {
          id: true,
          nickname: true,
          role: true,
        },
      });
      if (user?.nickname === roomName && user?.role === 'STREAMER') {
        const token = getAccessToken(true, user.nickname, roomName);
        const messages = await db.chat.findMany({
          take: 40,
          where: {
            room: roomName,
          },
          include: {
            user: {
              select: {
                nickname: true,
                chat_color: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        });
        return json({ user, user_type: 'streamer', token, server: LIVEKIT_SERVER, messages });
      }
    }
    return redirect('/');
  } else {
    const messages = await db.chat.findMany({
      take: 40,
      where: {
        room: roomName,
      },
      include: {
        user: {
          select: {
            nickname: true,
            chat_color: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    if (session) {
      user = await db.user.findUnique({
        where: {
          id: session.userId,
        },
        select: {
          id: true,
          nickname: true,
          role: true,
        },
      });
      if (user?.nickname === roomName && user?.role === 'STREAMER') {
        const token = getAccessToken(true, user.nickname, roomName);
        return json({ user, user_type: 'streamer', token, server: LIVEKIT_SERVER, messages });
      } else {
        const token = getAccessToken(false, user!.nickname, roomName);
        return json({ user, user_type: 'viewer', token, server: LIVEKIT_SERVER, messages });
      }
    } else {
      const token = getAccessToken(false, makeNick(10), roomName);
      return json({ user: null, user_type: 'viewer', token, server: LIVEKIT_SERVER, messages });
    }
  }
}

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();
  const message = formData.get('message');
  if (message) {
    const room = formData.get('room');
    const user_id = formData.get('user_id');
    if (room && user_id) {
      let new_message = await db.chat.create({
        data: {
          userId: user_id.toString(),
          message: message.toString(),
          room: room.toString(),
        },
      });
      try {
        chatEmitter.emit('message', new_message.id.toString());
        return json(null, { status: 201 });
      } catch (error) {
        if (error instanceof Error) {
          return json({ error: error.message }, { status: 400 });
        }
        throw error;
      }
    }
  }
  return json(null, { status: 201 });
}

export default function Room() {
  const { user, user_type, token, server } = useLoaderData<typeof loader>();

  return (
    <div className="w-full py-6 mx-auto sm:w-[90%] md:w-[75%] lg:w-[60%] xl:w-[50%] 2xl:w-[45%]">
      {user_type === 'streamer' ? (
        <Streamer user={user!} token={token} server={server} />
      ) : (
        <Viewer user={user!} token={token} server={server} />
      )}
    </div>
  );
}
