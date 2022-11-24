import type { ReactElement } from 'react';
import React from 'react';

import { VideoRenderer } from '@livekit/react-core';
import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';
import type { LocalAudioTrack, LocalVideoTrack } from 'livekit-client';
import { createLocalVideoTrack, createLocalAudioTrack } from 'livekit-client';
import ReactPlayer from 'react-player';

import { db } from '~/database';
import { requireAuthSession } from '~/modules/auth';
import { getAudioDevices, getVideoDevices } from '~/modules/livekit';

export async function loader({ request }: LoaderArgs) {
  const session = await requireAuthSession(request);
  if (!session) return redirect('/');

  const user = await db.user.findUnique({
    where: {
      id: session?.userId,
    },
    select: {
      id: true,
      nickname: true,
      role: true,
    },
  });
  if (user?.role !== 'STREAMER') return redirect('/');
  return json({ user });
}

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();
  const videoDevice = formData.get('video') as string;
  const audioDevice = formData.get('audio') as string;
  const userId = formData.get('userId') as string;
  const nickname = formData.get('nickname') as string;
  await db.devices.upsert({
    where: {
      userId,
    },
    update: {
      videoDevice,
      audioDevice,
    },
    create: {
      userId,
      videoDevice,
      audioDevice,
    },
  });
  // console.log(videoDevice, audioDevice, userId, nickname);
  return redirect(`/${nickname}`);
}

function StreamSetup() {
  const { user } = useLoaderData<typeof loader>();
  const [allAudioDevices, setAllAudioDevices] = React.useState<MediaDeviceInfo[]>();
  const [allVideoDevices, setAllVideoDevices] = React.useState<MediaDeviceInfo[]>();
  const [currentAudioDevice, setCurrentAudioDevice] = React.useState<MediaDeviceInfo>();
  const [currentVideoDevice, setCurrentVideoDevice] = React.useState<MediaDeviceInfo>();
  const [audioDevicesList, setAudioDevicesList] = React.useState<string[]>([]);
  const [videoDevicesList, setVideoDevicesList] = React.useState<string[]>([]);
  const [videoTrack, setVideoTrack] = React.useState<LocalVideoTrack>();
  const [audioTrack, setAudioTrack] = React.useState<LocalAudioTrack>();

  React.useEffect(() => {
    (async () => {
      const devices = await getAudioDevices().then((value) => value);
      setAllAudioDevices(devices);
      setCurrentAudioDevice(devices[0]);
      const devicesList = devices.map((device) => device.label);
      setAudioDevicesList(devicesList);
    })();
    (async () => {
      const devices = await getVideoDevices().then((value) => value);
      setAllVideoDevices(devices);
      setCurrentVideoDevice(devices[0]);
      const devicesList = devices.map((device) => device.label);
      setVideoDevicesList(devicesList);
    })();
  }, []);

  React.useEffect(() => {
    // enable video by default
    // let stream: LocalVideoTrack;

    createLocalVideoTrack({
      deviceId: currentVideoDevice?.deviceId,
    }).then((track) => {
      // stream = track;
      setVideoTrack(track);
    });
  }, [currentVideoDevice]);

  React.useEffect(() => {
    // enable video by default
    // let stream: LocalAudioTrack;
    createLocalAudioTrack({
      deviceId: currentAudioDevice?.deviceId,
    }).then((track) => {
      // stream = track;
      setAudioTrack(track);
    });
  }, [currentAudioDevice]);

  function changeVideoSource(source: string) {
    const index = allVideoDevices?.findIndex((device) => device.label === source);
    setCurrentVideoDevice(allVideoDevices![index!]);
  }

  function changeAudioSource(source: string) {
    const index = allAudioDevices?.findIndex((device) => device.label === source);
    setCurrentAudioDevice(allAudioDevices![index!]);
  }

  async function stopVideo() {
    if (videoTrack && audioTrack) {
      console.log('stopping video');
      videoTrack.stop();

      setVideoTrack(undefined);
      audioTrack?.stop();
      setAudioTrack(undefined);
    }
    // videoTrack?.stop();
    // audioTrack?.stop();
    // videoTrack?.attachedElements;
  }

  let videoElement: ReactElement;
  if (videoTrack && audioTrack) {
    // videoElement = <VideoRenderer track={videoTrack} isLocal={true} />;
    videoElement = (
      <ReactPlayer
        //
        playsinline // very very imp prop
        playIcon={<></>}
        //
        pip={false}
        light={false}
        controls={false}
        muted={true}
        playing={true}
        //
        url={videoTrack.mediaStream}
        style={{ transform: 'rotateY(180deg)' }}
        //
        height={'100%'}
        width={'100%'}
        // style={flipStyle}
        onError={(err) => {
          console.log(err, 'participant video error');
        }}
      />
    );
  } else {
    videoElement = <p>Loading stream...</p>;
  }
  return (
    <div className="w-full py-6 mx-auto sm:w-[90%] md:w-[75%] lg:w-[60%] xl:w-[50%] 2xl:w-[45%]">
      <div className="flex flex-col items-center justify-center w-full space-y-3">
        <p className="text-2xl font-bold">Stream setup</p>
        <p className="text-sm">{user.nickname}</p>
        <div className="w-full max-w-xs form-control">
          <label className="label">
            <span className="text-xs label-text">Select camera</span>
          </label>
          <select
            className="text-xs select select-bordered select-sm"
            onChange={(e) => changeVideoSource(e.currentTarget.value)}
          >
            {videoDevicesList.map((device) => (
              <option key={device}>{device}</option>
            ))}
          </select>
        </div>
        <div className="w-full max-w-xs form-control">
          <label className=" label">
            <span className="text-xs label-text">Select microphone</span>
          </label>
          <select
            className="text-xs select select-bordered select-sm"
            onChange={(e) => changeAudioSource(e.currentTarget.value)}
          >
            {audioDevicesList.map((device) => (
              <option key={device}>{device}</option>
            ))}
          </select>
        </div>
        {videoElement}
        <Form method="post">
          <input hidden readOnly defaultValue={currentVideoDevice?.deviceId} name="video" />
          <input hidden readOnly defaultValue={currentAudioDevice?.deviceId} name="audio" />
          <input hidden readOnly defaultValue={user.id} name="userId" />
          <input hidden readOnly defaultValue={user.nickname} name="nickname" />
          <button className="btn btn-primary" type="submit">
            Start stream
          </button>
        </Form>
        <button onClick={stopVideo}>Stop</button>
      </div>
    </div>
  );
}

export default StreamSetup;
