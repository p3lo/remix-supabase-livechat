import React from 'react';

import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { Form, Outlet } from '@remix-run/react';
import invariant from 'tiny-invariant';

import { db } from '~/database';
import { getAuthSession } from '~/modules/auth';
import { createRoom, deleteRoom, getRoom } from '~/modules/livekit';

export async function loader({ request, params }: LoaderArgs) {
  const session = await getAuthSession(request);
  const roomName = params.room_id;
  invariant(roomName, 'Room name is required');
  const room = await getRoom(roomName);
  if (room.length === 0) {
    if (!session) return redirect('/');
    const user = await db.user.findUnique({
      where: {
        id: session?.userId,
      },
      select: {
        nickname: true,
        role: true,
      },
    });
    if (!user || user.nickname !== roomName) {
      return redirect('/');
    }
  }

  // await createRoom(roomName);
  // await deleteRoom(roomName);

  if (room) {
    console.log('room', room);
  }
  return null;
}

export async function action({ request, params }: ActionArgs) {
  const formData = await request.formData();
  const action = formData.get('action') as string;
  if (action === 'create') {
    await createRoom(params.room_id as string);
  }
  if (action === 'delete') {
    await deleteRoom(params.room_id as string);
  }
  return null;
}

function MainStreamRoom() {
  return (
    <>
      <Outlet />
      <Form method="post" className="flex flex-col">
        <button type="submit" name="action" value="create">
          Create Room
        </button>
        <button type="submit" name="action" value="delete">
          Delete Room
        </button>
      </Form>
    </>
  );
}

export default MainStreamRoom;
