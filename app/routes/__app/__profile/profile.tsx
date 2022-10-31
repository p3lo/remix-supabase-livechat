import React from 'react';

import type { ActionArgs } from '@remix-run/node';
import {
  json,
  unstable_composeUploadHandlers as composeUploadHandlers,
  unstable_createFileUploadHandler as createFileUploadHandler,
  unstable_createMemoryUploadHandler as createMemoryUploadHandler,
  unstable_parseMultipartFormData as parseMultipartFormData,
} from '@remix-run/node';
import { Form, useActionData, useMatches } from '@remix-run/react';
import invariant from 'tiny-invariant';

import { Image } from '~/components/image';
import { db } from '~/database';
import type { User } from '~/modules/user/types';

type ActionData = {
  id?: null | string;
  nickname?: null | string;
  image?: null | string;
  errorNick?: null | string;
  errorImage?: null | string;
};

export async function action({ request }: ActionArgs) {
  const clonedData = request.clone();
  const formData = await clonedData.formData();
  if (formData.get('what') === 'update_nick') {
    const id = formData.get('userid') as string;
    const nickname = formData.get('nickname') as string;
    if (!id || !nickname) {
      return json<ActionData>({ errorNick: 'Nickname is already taken.' }, { status: 400 });
    }
    invariant(typeof id === 'string', 'Invalid user id');
    invariant(typeof nickname === 'string', 'Invalid nickname');
    const updatedUser = await db.user.update({ where: { id }, data: { nickname } });
    // HANDLE DUPLICATE NICKNAME
  }
  if (formData.get('what') === 'upload_image') {
    const uploadHandler = composeUploadHandlers(
      createFileUploadHandler({
        directory: 'public/assets',
        maxPartSize: 3000000,
      }),
      createMemoryUploadHandler()
    );
    const formData = await parseMultipartFormData(request, uploadHandler);
    const image = formData.get('img');
    if (!image || typeof image === 'string') {
      return json({
        errorImage: 'Upload failed.',
      });
    }
    return json({
      image: image.name,
    });
  }
  return null;
}

function Profile() {
  const user: User = useMatches()[1].data?.user as User;
  const data = useActionData<ActionData>();

  return (
    <div className="flex flex-col items-center justify-center w-full space-y-3">
      <p className="text-2xl font-bold">Profile</p>
      <div className="avatar placeholder">
        <div className="w-32 rounded-full bg-neutral-focus text-neutral-content">
          <span className="text-2xl">{user.nickname.charAt(0).toUpperCase()}</span>
        </div>
      </div>
      <Form method="post" encType="multipart/form-data" className="flex flex-col items-center justify-center">
        <input
          type="file"
          name="img"
          accept="image/*"
          className="file-input file-input-bordered file-input-xs w-[250px] max-w-xs"
        />
        {data?.errorImage && <p className="text-xs text-red-500">{data.errorImage}</p>}
        <button type="submit" name="what" value="upload_image" className="btn btn-xs btn-ghost w-[250px]">
          Upload
        </button>
        {data?.image && <p className="text-xs text-green-500">Image uploaded successfully.</p>}
      </Form>
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
          {data?.errorNick && <span className="text-red-500 label-text-alt">{data.errorNick}</span>}
        </div>
        <button type="submit" name="what" value="update_nick" className="btn w-[150px]">
          Save
        </button>
      </Form>
      <Image src="pythoncover.png" width={150} fit="contain" alt="notfound" />
    </div>
  );
}

export default Profile;
