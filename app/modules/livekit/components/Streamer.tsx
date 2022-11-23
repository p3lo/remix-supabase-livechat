import React from 'react';

import { useRoom } from '@livekit/react-core';
import type { LocalParticipant, Room, RoomConnectOptions, RoomOptions } from 'livekit-client';
import { ConnectionState, VideoPresets } from 'livekit-client';

import { setMediaEnabled } from '../service.client';
import { StreamerVideo } from './StreamerVideo';

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

export function Streamer({
  user,
  devices,
  token,
  server,
}: {
  user: { id: string; nickname: string; role: string };
  devices: { videoDevice: string; audioDevice: string };
  token: string;
  server: string;
}) {
  const [myInfo, setMyInfo] = React.useState<LocalParticipant | undefined>(undefined);
  const { room, participants, connect } = useRoom(roomOptions);

  async function init() {
    const connectedRoom = await connect(server, token, connectOptions);
    if (!connectedRoom) {
      return;
    }

    if (connectedRoom.state === ConnectionState.Connected) {
      await onConnected(connectedRoom, devices);
    }

    const info = room?.localParticipant;
    setMyInfo(info);
  }

  React.useEffect(() => {
    init().catch(console.error);
  }, []);

  if (room?.state === ConnectionState.Connecting) {
    return <>...loading</>;
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
    <>
      {myInfo ? (
        <div className="flex flex-col">
          <p className="text-xs font-bold text-red-600">My name: {myInfo.identity}</p>
          <p className="text-xs font-bold text-red-600">My sid: {myInfo.sid}</p>
          <StreamerVideo myinfo={myInfo} room={room} />
        </div>
      ) : null}
    </>
  );
}
