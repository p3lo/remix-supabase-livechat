import React from 'react';

import type { LoaderArgs } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { Outlet } from '@remix-run/react';
import invariant from 'tiny-invariant';

import { db } from '~/database';
import { getAuthSession } from '~/modules/auth';
import { getRoom } from '~/modules/livekit';

export async function loader({ request, params }: LoaderArgs) {
  const session = await getAuthSession(request);
  const roomName = params.room_id;
  invariant(roomName, 'Room name is required');
  const room = await getRoom(roomName);
  if (!session && room.length === 0) return redirect('/');
  let user: { id: string; nickname: string; role: string } | null = null;
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
  }
  if (user?.nickname === roomName) return redirect(`/stream/${roomName}`);
  if (room.length > 0) return redirect(`/view/${roomName}`);

  return redirect('/');
}
