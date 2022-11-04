import type { Room } from 'livekit-server-sdk';
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';

import { LIVEKIT_API, LIVEKIT_SECRET, LIVEKIT_SERVER } from '~/utils';

export function getAccessToken(is_streamer: boolean, user: string, roomName: string) {
  const at = new AccessToken(LIVEKIT_API, LIVEKIT_SECRET, {
    identity: user,
  });
  if (is_streamer) {
    at.addGrant({
      roomJoin: true,
      room: roomName,
      roomAdmin: true,
      canPublish: true,
      canPublishData: true,
      canSubscribe: true,
    });
  } else {
    at.addGrant({
      roomJoin: true,
      room: roomName,
      roomAdmin: false,
      canPublish: false,
      canPublishData: false,
      canSubscribe: true,
    });
  }
  const token = at.toJwt();
  return token;
}

export async function createRoom(roomName: string) {
  const svc = new RoomServiceClient(LIVEKIT_SERVER, LIVEKIT_API, LIVEKIT_SECRET);
  const options = {
    name: roomName,
  };
  svc.createRoom(options).then((room: Room) => {
    console.log('room created');
  });
}

export async function deleteRoom(roomName: string) {
  const svc = new RoomServiceClient(LIVEKIT_SERVER, LIVEKIT_API, LIVEKIT_SECRET);
  svc.deleteRoom(roomName).then(() => {
    console.log('room deleted');
  });
}

export async function getRoom(roomName: string) {
  const svc = new RoomServiceClient(LIVEKIT_SERVER, LIVEKIT_API, LIVEKIT_SECRET);
  const room = await svc.listRooms([roomName]);
  return room;
}
