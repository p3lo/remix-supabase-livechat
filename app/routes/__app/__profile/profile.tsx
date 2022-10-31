import React from 'react';

import type { ActionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useActionData, useMatches } from '@remix-run/react';
import invariant from 'tiny-invariant';

import type { User } from '~/modules/user/types';

type ActionData = { id: null | string; nickname: null | string };

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();
  const id = formData.get('userid') as string;
  const nickname = formData.get('nickname') as string;

  const errors: ActionData = { id: id ? null : 'Id is required', nickname: nickname ? null : 'Nickname is required' };
  const hasErrors = Object.values(errors).some((errorMessage) => errorMessage);
  if (hasErrors) {
    return json<ActionData>(errors);
  }
  invariant(typeof id === 'string', 'Invalid user id');
  invariant(typeof nickname === 'string', 'Invalid nickname');

  return null;
}

function Profile() {
  const user: User = useMatches()[1].data?.user as User;
  const errors = useActionData();

  return (
    <div className="flex flex-col items-center justify-center w-full space-y-3">
      <p className="text-2xl font-bold">Profile</p>
      <div className="avatar placeholder">
        <div className="w-32 rounded-full bg-neutral-focus text-neutral-content">
          <span className="text-2xl">{user.nickname.charAt(0).toUpperCase()}</span>
        </div>
      </div>
      <p className="text-sm">{user.email}</p>
      <p className="text-sm">Credits: ( {user.credits} )</p>
      <Form method="post" className="flex flex-col items-center w-full space-y-2">
        <div className="w-full max-w-xs form-control">
          <label className="label">
            <span className="label-text">Nickname</span>
          </label>
          <input hidden readOnly name="userid" defaultValue={user.id} />
          <input
            type="text"
            name="nickname"
            placeholder="Nickname"
            defaultValue={user.nickname}
            className="w-full max-w-xs input input-bordered"
          />
          {errors?.nickname && <span className="text-red-500 label-text-alt">{errors.nickname}</span>}
        </div>
        <button type="submit" className="btn w-[150px]">
          Save
        </button>
      </Form>
    </div>
  );
}

export default Profile;
