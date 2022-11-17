import React from 'react';

import { useRoom } from '@livekit/react-core';
import type { LocalParticipant, Room, RoomConnectOptions, RoomOptions } from 'livekit-client';
import { ConnectionState, VideoPresets } from 'livekit-client';

import { getAudioDevices, getVideoDevices, setMediaEnabled } from '../service.client';

const roomOptions: RoomOptions = {
  adaptiveStream: true,
  dynacast: true,
  publishDefaults: {
    simulcast: true,
    videoCodec: 'h264',
  },
  videoCaptureDefaults: {
    resolution: VideoPresets.h540.resolution,
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

  React.useEffect(() => {
    (async () => {
      const connectedRoom = await connect(server, token, connectOptions);
      if (!connectedRoom) {
        return;
      }

      if (onConnected && connectedRoom.state === ConnectionState.Connected) {
        await onConnected(connectedRoom, devices);
      }

      const info = room?.localParticipant;
      setMyInfo(info);
    })();

    return () => {
      if (room?.state !== ConnectionState.Disconnected) {
        room?.disconnect();
      }
    };
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

  return <div>Streamer</div>;
}
