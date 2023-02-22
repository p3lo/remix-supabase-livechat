import React from 'react';

import { useRoom } from '@livekit/react-core';
import type { ActionArgs, LinksFunction, LoaderArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useActionData, useLoaderData } from '@remix-run/react';
import invariant from 'tiny-invariant';

import { db } from '~/database';
import { getAuthSession } from '~/modules/auth';
import { chatEmitter } from '~/modules/chat/emitter.server';
import { getAccessToken, getRoom } from '~/modules/livekit';
import { Chat } from '~/modules/livekit/components/Chat';
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
  const room_info = await db.user.findUnique({
    where: {
      nickname: roomName,
    },
    include: {
      Room: true,
    },
  });
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
        if (!room_info?.Room?.realName) {
          return redirect(`/room_settings`);
        }

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
        return json({ user, user_type: 'streamer', token, server: LIVEKIT_SERVER, messages, roomName, room_info });
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
        return json({ user, user_type: 'streamer', token, server: LIVEKIT_SERVER, messages, roomName, room_info });
      } else {
        const token = getAccessToken(false, user!.nickname, roomName);
        return json({ user, user_type: 'viewer', token, server: LIVEKIT_SERVER, messages, roomName, room_info });
      }
    } else {
      const token = getAccessToken(false, makeNick(10), roomName);
      return json({ user: null, user_type: 'viewer', token, server: LIVEKIT_SERVER, messages, roomName, room_info });
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
  const { user, user_type, token, server, roomName, room_info } = useLoaderData<typeof loader>();

  return (
    <div className="flex flex-col w-full mx-auto sm:w-[90%] md:w-[95%] lg:w-[85%] xl:w-[75%] 2xl:w-[70%] border border-spacing-1 border-gray-500/50 p-1 m-3">
      <div className="flex items-center p-3 space-x-3">
        <p className="text-sm font-bold ">{room_info?.nickname} -</p>
        <p className="text-sm">{room_info?.Room?.description}</p>
      </div>
      {user_type === 'streamer' ? (
        <div className="grid grid-cols-3 gap-1 p-1 border border-gray-500/50 ">
          <div className="col-span-3 md:col-span-2 h-[70vh]">
            <Streamer user={user!} token={token} server={server} />
          </div>
          <div className="col-span-3 md:col-span-1 h-[30vh] md:h-[70vh]">
            <Chat room={roomName} user={user!} />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1 p-1 border border-gray-500/50 ">
          <div className="col-span-3 md:col-span-2 h-[60vh]">
            <Viewer user={user!} token={token} server={server} />
          </div>
          <div className="col-span-3 md:col-span-1 h-[30vh] md:h-[60vh]">
            <Chat room={roomName} user={user!} />
          </div>
        </div>
      )}
      <div className="flex flex-col p-3 space-y-2">
        <p className="p-2 font-bold">{room_info?.nickname} Bio</p>
        <div className="flex items-center">
          <p className="text-sm font-bold basis-2/4 md:basis-1/4">Real Name:</p>
          <p className="text-sm">{room_info?.Room?.realName}</p>
        </div>
        <div className="flex items-center">
          <p className="text-sm font-bold basis-2/4 md:basis-1/4">Age:</p>
          <p className="text-sm">{room_info?.Room?.age}</p>
        </div>
        <div className="flex items-center">
          <p className="text-sm font-bold basis-2/4 md:basis-1/4">My Rate:</p>
          <p className="text-sm">{room_info?.Room?.ratePerMin} per minute</p>
        </div>
      </div>
    </div>
  );
}
