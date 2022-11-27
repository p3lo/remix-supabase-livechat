import React from 'react';

import { useRoom } from '@livekit/react-core';
import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';
import type { LocalParticipant, Room, RoomConnectOptions, RoomOptions } from 'livekit-client';
import { VideoPresets, ConnectionState } from 'livekit-client';

import { db } from '~/database';
import { requireAuthSession } from '~/modules/auth';
import { getAccessToken, getAudioDevices, getVideoDevices } from '~/modules/livekit';
import { StreamerVideo } from '~/modules/livekit/components/StreamerVideo';
import { setMediaEnabled } from '~/modules/livekit/service.client';
import { LIVEKIT_SERVER } from '~/utils';

const roomOptions: RoomOptions = {
  adaptiveStream: true,
  dynacast: true,
  publishDefaults: {
    simulcast: true,
    videoCodec: 'h264',
  },
  videoCaptureDefaults: {
    resolution: VideoPresets.h720.resolution,
  },
  audioCaptureDefaults: {
    echoCancellation: true,
    noiseSuppression: true,
  },
};

const connectOptions: RoomConnectOptions = {};

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
  const token = getAccessToken(true, user.nickname, `${user.nickname}-setup`);
  return json({ user, token, server: LIVEKIT_SERVER });
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
  const { user, token, server } = useLoaderData<typeof loader>();
  const [allAudioDevices, setAllAudioDevices] = React.useState<MediaDeviceInfo[]>();
  const [allVideoDevices, setAllVideoDevices] = React.useState<MediaDeviceInfo[]>();
  const [currentAudioDevice, setCurrentAudioDevice] = React.useState<MediaDeviceInfo>();
  const [currentVideoDevice, setCurrentVideoDevice] = React.useState<MediaDeviceInfo>();
  const [audioDevicesList, setAudioDevicesList] = React.useState<string[]>([]);
  const [videoDevicesList, setVideoDevicesList] = React.useState<string[]>([]);
  const [myInfo, setMyInfo] = React.useState<LocalParticipant | undefined>(undefined);
  const didMountRef = React.useRef(false);

  const { room, connect } = useRoom(roomOptions);

  React.useEffect(
    () => () => {
      if (didMountRef.current) {
        if (room) {
          Promise.all([
            room.localParticipant.setCameraEnabled(false),
            room.localParticipant.setMicrophoneEnabled(false),
          ]).then(() => {});
          room.disconnect();
        }
      }
      didMountRef.current = true;
    },
    []
  );

  async function init() {
    const audio = await getAudioDevices().then((value) => value);
    const video = await getVideoDevices().then((value) => value);

    const connectedRoom = await connect(server, token, connectOptions);
    if (!connectedRoom) {
      return;
    }

    if (connectedRoom.state === ConnectionState.Connected) {
      await onConnected(connectedRoom, { audioDevice: audio[0].deviceId, videoDevice: video[0].deviceId });
    }

    const info = room?.localParticipant;
    setMyInfo(info);
  }

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
    init();
  }, []);

  function changeVideoSource(source: string) {
    const index = allVideoDevices?.findIndex((device) => device.label === source);
    setCurrentVideoDevice(allVideoDevices![index!]);
    if (room) {
      room.switchActiveDevice('videoinput', allVideoDevices![index!].deviceId);
    }
  }

  function changeAudioSource(source: string) {
    const index = allAudioDevices?.findIndex((device) => device.label === source);
    setCurrentAudioDevice(allAudioDevices![index!]);
    if (room) {
      room.switchActiveDevice('audioinput', allAudioDevices![index!].deviceId);
    }
  }

  async function onConnected(room: Room, devices: { videoDevice: string; audioDevice: string }) {
    await setMediaEnabled({
      room,
      audioEnabled: true,
      audioDeviceId: devices.audioDevice,
      videoEnabled: true,
      videoDeviceId: devices.videoDevice,
    });
  }

  return (
    <div className="mx-auto w-full py-6 sm:w-[90%] md:w-[75%] lg:w-[60%] xl:w-[50%] 2xl:w-[45%]">
      <div className="flex flex-col items-center justify-center w-full space-y-3">
        <p className="text-2xl font-bold">Stream setup</p>
        <p className="text-sm">{user.nickname}</p>
        <div className="w-full max-w-xs form-control">
          <label className="label">
            <span className="text-xs label-text">Select camera</span>
          </label>
          <select
            className="text-xs select-bordered select select-sm"
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
            className="text-xs select-bordered select select-sm"
            onChange={(e) => changeAudioSource(e.currentTarget.value)}
          >
            {audioDevicesList.map((device) => (
              <option key={device}>{device}</option>
            ))}
          </select>
        </div>
        {myInfo && <StreamerVideo myinfo={myInfo} room={room} />}
        <Form method="post">
          <input hidden readOnly defaultValue={currentVideoDevice?.deviceId} name="video" />
          <input hidden readOnly defaultValue={currentAudioDevice?.deviceId} name="audio" />
          <input hidden readOnly defaultValue={user.id} name="userId" />
          <input hidden readOnly defaultValue={user.nickname} name="nickname" />
          <button className="btn-primary btn" type="submit">
            Start stream
          </button>
        </Form>
      </div>
    </div>
  );
}

export default StreamSetup;
