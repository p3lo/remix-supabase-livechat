import { Room } from 'livekit-client';

interface SetMediaEnabledParams {
  room: Room;
  audioEnabled: boolean;
  videoEnabled: boolean;
  audioDeviceId: string;
  videoDeviceId: string;
}

export async function getAudioDevices() {
  const devices = await Room.getLocalDevices('audioinput');
  return devices;
}

export async function getVideoDevices() {
  const devices = await Room.getLocalDevices('videoinput');
  return devices;
}

export async function setMediaEnabled({
  room,
  audioEnabled,
  audioDeviceId,
  videoEnabled,
  videoDeviceId,
}: SetMediaEnabledParams) {
  // make it easier to debug
  (window as any).currentRoom = room;

  if (audioEnabled) {
    if (audioDeviceId && room.options.audioCaptureDefaults) {
      room.options.audioCaptureDefaults.deviceId = audioDeviceId;
    }
    await room.localParticipant.setMicrophoneEnabled(true);
  }

  if (videoEnabled) {
    if (videoDeviceId && room.options.videoCaptureDefaults) {
      room.options.videoCaptureDefaults.deviceId = videoDeviceId;
    }
    await room.localParticipant.setCameraEnabled(true);
  }
}
