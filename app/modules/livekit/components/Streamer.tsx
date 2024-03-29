import React from 'react';

import { useRoom } from '@livekit/react-core';
import type { LocalParticipant, Room, RoomConnectOptions, RoomOptions } from 'livekit-client';
import { ConnectionState, VideoPresets } from 'livekit-client';

import { getAudioDevices, getVideoDevices, setMediaEnabled } from '../service.client';
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
  token,
  server,
}: {
  user: { id: string; nickname: string; role: string };
  token: string;
  server: string;
}) {
  const [myInfo, setMyInfo] = React.useState<LocalParticipant | undefined>(undefined);
  const { room, connectionState, connect } = useRoom(roomOptions);
  const [allAudioDevices, setAllAudioDevices] = React.useState<MediaDeviceInfo[]>();
  const [allVideoDevices, setAllVideoDevices] = React.useState<MediaDeviceInfo[]>();
  const [audioDevicesList, setAudioDevicesList] = React.useState<string[]>([]);
  const [videoDevicesList, setVideoDevicesList] = React.useState<string[]>([]);
  const [isAudioEnabled, setIsAudioEnabled] = React.useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = React.useState(true);

  async function connectRoom() {
    (async () => {
      const devices = await getAudioDevices().then((value) => value);
      setAllAudioDevices(devices);
      const devicesList = devices.map((device) => device.label);
      setAudioDevicesList(devicesList);
    })();
    (async () => {
      const devices = await getVideoDevices().then((value) => value);
      setAllVideoDevices(devices);
      const devicesList = devices.map((device) => device.label);
      setVideoDevicesList(devicesList);
    })();
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
    connectRoom().catch(console.error);
  }, [room]);

  React.useEffect(() => {
    (async () => {
      await connect(server, token, connectOptions);
    })();
    return () => {
      if (room) {
        Promise.all([
          room.localParticipant.setCameraEnabled(false),
          room.localParticipant.setMicrophoneEnabled(false),
        ]).then(() => {});
        room.disconnect();
      }
    };
  }, []);

  if (room?.state === ConnectionState.Connecting) {
    return <>...loading</>;
  }

  function changeVideoSource(source: string) {
    const index = allVideoDevices?.findIndex((device) => device.label === source);
    if (room) {
      room.switchActiveDevice('videoinput', allVideoDevices![index!].deviceId);
    }
  }

  function changeAudioSource(source: string) {
    const index = allAudioDevices?.findIndex((device) => device.label === source);
    if (room) {
      room.switchActiveDevice('audioinput', allAudioDevices![index!].deviceId);
    }
  }

  const toggleAudio = async () => {
    if (!room) return;
    const enabled = room.localParticipant.isMicrophoneEnabled;
    await room.localParticipant.setMicrophoneEnabled(!enabled);
    setIsAudioEnabled(!enabled);
  };

  const toggleVideo = async () => {
    if (!room) return;
    const enabled = room.localParticipant.isCameraEnabled;
    await room.localParticipant.setCameraEnabled(!enabled);
    setIsVideoEnabled(!enabled);
  };

  const leaveRoom = async () => {
    if (!room) return;
    await Promise.all([
      room.localParticipant.setCameraEnabled(false),
      room.localParticipant.setMicrophoneEnabled(false),
    ]);
    room.disconnect();
  };

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
    <div className="relative flex flex-col w-full h-full space-y-1">
      {myInfo ? (
        <>
          <div className="flex flex-col flex-none w-full px-2 py-1 border border-dashed rounded-lg md:flex-row border-gray-500/50 justify-evenly">
            <div className="w-full md:w-[45%] form-control">
              <label className="label">
                <span className="text-xs label-text">Select camera</span>
              </label>
              <select
                disabled={connectionState !== ConnectionState.Connected}
                className="text-xs select-bordered select select-sm"
                onChange={(e) => changeVideoSource(e.currentTarget.value)}
              >
                {videoDevicesList.map((device) => (
                  <option key={device}>{device}</option>
                ))}
              </select>
            </div>
            <div className="w-full md:w-[45%] form-control">
              <label className=" label">
                <span className="text-xs label-text">Select microphone</span>
              </label>
              <select
                disabled={connectionState !== ConnectionState.Connected}
                className="text-xs select-bordered select select-sm"
                onChange={(e) => changeAudioSource(e.currentTarget.value)}
              >
                {audioDevicesList.map((device) => (
                  <option key={device}>{device}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex grow">
            <StreamerVideo myinfo={myInfo} room={room} />
          </div>

          <div className="flex flex-col flex-none w-full px-2 py-1 space-y-1 border border-dashed rounded-lg md:flex-row md:space-y-0 border-gray-500/50 justify-evenly">
            <button
              className="btn btn-outline btn-sm w-full md:w-[150px]"
              onClick={toggleAudio}
              disabled={connectionState !== ConnectionState.Connected}
            >
              {isAudioEnabled ? 'Mute Audio' : 'Unmute Audio'}
            </button>
            <button
              className="btn btn-outline btn-sm w-full md:w-[150px]"
              onClick={toggleVideo}
              disabled={connectionState !== ConnectionState.Connected}
            >
              {isVideoEnabled ? 'Mute Video' : 'Unmute Video'}
            </button>
            <button
              className="btn btn-outline btn-sm w-full md:w-[150px]"
              onClick={leaveRoom}
              disabled={connectionState !== ConnectionState.Connected}
            >
              End Stream
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
