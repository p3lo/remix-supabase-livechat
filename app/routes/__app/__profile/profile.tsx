import * as fs from 'fs';

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
import { ChromePicker } from 'react-color';
import { BsPalette } from 'react-icons/bs';
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
  const id = formData.get('userid') as string;
  invariant(typeof id === 'string', 'Invalid user id');
  if (formData.get('what') === 'update_nick') {
    const nickname = formData.get('nickname') as string;
    const chat_color = formData.get('chatColor') as string;
    if (!id || !nickname) {
      return json<ActionData>({ errorNick: 'Nickname is already taken.' }, { status: 400 });
    }

    invariant(typeof nickname === 'string', 'Invalid nickname');
    invariant(typeof chat_color === 'string', 'Invalid chat color');
    const updatedUser = await db.user.update({ where: { id }, data: { nickname, chat_color } });
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
    const formDataOrig = await parseMultipartFormData(request, uploadHandler);
    const image = formDataOrig.get('img');
    if (!image || typeof image === 'string') {
      return json({
        errorImage: 'Upload failed.',
      });
    }
    const oldAvatar = formData.get('oldavatar') as string;
    if (oldAvatar) {
      fs.unlink(`public/assets/${oldAvatar}`, (err) => {
        if (err) throw err;
      });
    }
    await db.user.update({
      where: { id },
      data: {
        avatar: image.name,
      },
    });
    return json({
      image: image.name,
    });
  }
  return null;
}

function Profile() {
  const user: User = useMatches()[1].data?.user as User;
  const data = useActionData<ActionData>();
  const [color, setColor] = React.useState(user.chat_color);

  return (
    <div className="flex flex-col items-center justify-center w-full space-y-3">
      <p className="text-2xl font-bold">Profile</p>
      <div className="avatar placeholder">
        {user.avatar ? (
          <div className="w-32 rounded-full">
            <Image src={user.avatar} width={150} fit="contain" alt="notfound" />
          </div>
        ) : (
          <div className="w-32 rounded-full bg-neutral-focus text-neutral-content">
            <span className="text-2xl">{user.nickname.charAt(0).toUpperCase()}</span>
          </div>
        )}
      </div>
      <Form method="post" encType="multipart/form-data" className="flex flex-col items-center justify-center">
        <input
          type="file"
          name="img"
          accept="image/*"
          className="file-input file-input-bordered file-input-xs w-[250px] max-w-xs"
        />
        <input hidden readOnly name="userid" defaultValue={user.id} />
        <input hidden readOnly name="oldavatar" defaultValue={user.avatar} />
        {data?.errorImage && <p className="text-xs text-red-500">{data.errorImage}</p>}
        <button type="submit" name="what" value="upload_image" className="btn btn-xs btn-ghost w-[250px]">
          Upload
        </button>
        {data?.image && <p className="text-xs text-green-500">Image uploaded successfully.</p>}
      </Form>
      <p className="text-sm">{user.email}</p>
      <p className="text-sm">Token balance: {user.credits}</p>
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
          <div className="dropdown dropdown-end pt-2">
            <label className="label">
              <span className="label-text">Set your nick chat color</span>
            </label>
            <label tabIndex={0} className="btn btn-circle btn-ghost btn-xs text-info">
              <BsPalette style={{ color: color }} className={` w-[20px] h-[20px]`} />
            </label>
            <div tabIndex={0} className="card compact dropdown-content shadow bg-base-100 rounded-box w-64">
              <ChromePicker color={color} onChange={(newColor) => setColor(newColor.hex)} />
            </div>
          </div>
          <input hidden readOnly name="chatColor" value={color} />
        </div>
        <button type="submit" name="what" value="update_nick" className="btn w-[150px]">
          Save
        </button>
      </Form>
    </div>
  );
}

export default Profile;
