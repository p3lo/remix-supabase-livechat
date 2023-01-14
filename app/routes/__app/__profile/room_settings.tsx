import React from 'react';

import { redirect, json } from '@remix-run/node';
import type { LoaderArgs, ActionArgs } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';

import { db } from '~/database';
import { getAuthSession } from '~/modules/auth';

export async function loader({ request }: LoaderArgs) {
  const session = await getAuthSession(request);
  if (!session) return json({ user: null }, { status: 401 });
  const user = await db.user.findUnique({
    where: {
      id: session.userId,
    },
    include: {
      Room: true,
    },
  });
  if (user?.role !== 'STREAMER') return redirect('/');
  return json({ user });
}

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();
  const id = formData.get('userid') as string;
  if (!id) return json({ error: 'Invalid user id' }, { status: 400 });
  const realName = formData.get('realname') as string;
  const age = formData.get('age') as string;
  const rate = formData.get('rate') as string;
  const description = formData.get('description') as string;
  if (!realName || !age || !rate || !description) return json({ error: 'Invalid data' }, { status: 400 });
  const updateRoomSettings = await db.room.upsert({
    where: {
      userId: id,
    },
    update: {
      realName,
      age: parseInt(age),
      ratePerMin: parseFloat(rate),
      description,
    },
    create: {
      realName,
      age: parseInt(age),
      ratePerMin: parseFloat(rate),
      description,
      userId: id,
    },
  });

  return json({ error: null }, { status: 200 });
}

function RoomSettings() {
  const { user } = useLoaderData<typeof loader>();
  const data = useLoaderData<typeof action>();

  return (
    <div className="flex flex-col items-center justify-center w-full space-y-3">
      <p className="text-2xl font-bold">Room settings</p>
      {data?.error && <p className="text-red-500">{data.error}</p>}
      <Form method="post" className="flex flex-col items-center w-full space-y-2">
        <div className="w-full max-w-xs form-control">
          <label className="label">
            <span className="text-xs label-text">Real name</span>
          </label>
          <input hidden readOnly name="userid" defaultValue={user?.id} />
          <input
            required
            type="text"
            name="realname"
            placeholder="Your name"
            defaultValue={user?.Room?.realName}
            className="w-full max-w-xs input-sm input input-bordered"
          />
        </div>
        <div className="w-full max-w-xs form-control">
          <label className="label">
            <span className="text-xs label-text">Age</span>
          </label>
          <input
            required
            type="number"
            name="age"
            placeholder="Your age"
            defaultValue={user?.Room?.age}
            className="w-full max-w-xs input-sm input input-bordered"
          />
        </div>
        <div className="w-full max-w-xs form-control">
          <label className="label">
            <span className="text-xs label-text">Rate per minute</span>
          </label>
          <input
            required
            type="number"
            step="0.2"
            name="rate"
            placeholder="Your rate"
            defaultValue={user?.Room?.ratePerMin || 0.2}
            className="w-full max-w-xs input-sm input input-bordered"
          />
        </div>
        <div className="w-full max-w-xs form-control">
          <label className="label">
            <span className="text-xs label-text">Room description</span>
          </label>
          <textarea
            required
            name="description"
            defaultValue={user?.Room?.description}
            className="textarea textarea-bordered"
            placeholder="Describe your room"
          />
        </div>
        <button type="submit" name="what" value="update_nick" className="btn w-[150px]">
          Save
        </button>
      </Form>
    </div>
  );
}

export default RoomSettings;
