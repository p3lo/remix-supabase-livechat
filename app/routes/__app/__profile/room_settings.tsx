import React from 'react';

import type { LoaderArgs } from '@remix-run/node';
import { redirect, json } from '@remix-run/node';

import { db } from '~/database';
import { getAuthSession } from '~/modules/auth';

export async function loader({ request }: LoaderArgs) {
  const session = await getAuthSession(request);
  if (!session) return json({ user: null }, { status: 401 });
  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (user?.role !== 'STREAMER') return redirect('/');
  return json({ user });
}

function RoomSettings() {
  return <div>room_settings</div>;
}

export default RoomSettings;
