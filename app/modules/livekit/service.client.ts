import { Room } from 'livekit-client';

export async function getAudioDevices() {
  const devices = await Room.getLocalDevices('audioinput');
  return devices;
}

export async function getVideoDevices() {
  const devices = await Room.getLocalDevices('videoinput');
  return devices;
}
