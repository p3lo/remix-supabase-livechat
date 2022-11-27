import React from 'react';

import type { LinksFunction, LoaderArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import invariant from 'tiny-invariant';

import { db } from '~/database';
import { getAuthSession } from '~/modules/auth';
import { getAccessToken, getRoom } from '~/modules/livekit';
import { Streamer } from '~/modules/livekit/components/Streamer';
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
        return json({ user, user_type: 'streamer', devices, token, server: LIVEKIT_SERVER });
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
        return json({ user, user_type: 'streamer', devices, token, server: LIVEKIT_SERVER });
      } else {
        const token = getAccessToken(false, user!.nickname, roomName);
        return json({ user, user_type: 'viewer', devices: null, token, server: LIVEKIT_SERVER });
      }
    } else {
      const token = getAccessToken(false, 'guest', roomName);
      return json({ user: null, user_type: 'viewer', devices: null, token, server: LIVEKIT_SERVER });
    }
  }
}

export default function Room() {
  const { user, user_type, devices, token, server } = useLoaderData<typeof loader>();

  return (
    <div className="w-full py-6 mx-auto sm:w-[90%] md:w-[75%] lg:w-[60%] xl:w-[50%] 2xl:w-[45%]">
      {user_type === 'streamer' && <Streamer user={user!} devices={devices!} token={token} server={server} />}
      {/* {user_type === 'streamer' && (
        <StreamerSettings
          url={server}
          token={token}
          roomId={user!.nickname.toLowerCase()}
          getName={user!.nickname.toLowerCase()}
          audioEnabled={true}
          audioDevice={devices!.audioDevice}
          videoEnabled={true}
          videoDevice={devices!.videoDevice}
        />
      )} */}
    </div>
  );
}
