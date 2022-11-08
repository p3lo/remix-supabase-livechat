import React from 'react';

import type { LoaderArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import invariant from 'tiny-invariant';

import { db } from '~/database';
import { getAuthSession } from '~/modules/auth';
import { getAccessToken, getRoom } from '~/modules/livekit';

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
        const devices = await db.devices.findUnique({
          where: {
            userId: user.id,
          },
          select: {
            videoDevice: true,
            audioDevice: true,
          },
        });
        if (!devices) return redirect('/stream-setup');
        const token = getAccessToken(true, user.nickname, roomName);
        return json({ user, user_type: 'streamer', devices, token });
      }
    }
    return redirect('/');
  } else {
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
      const token = getAccessToken(false, user!.nickname, roomName);
      return json({ user, user_type: 'viewer', devices: null, token });
    } else {
      const token = getAccessToken(false, 'guest', roomName);
      return json({ user: null, user_type: 'viewer', devices: null, token });
    }
  }
}

export default function Room() {
  const { user, user_type, devices, token } = useLoaderData<typeof loader>();
  return <div>Room</div>;
}
