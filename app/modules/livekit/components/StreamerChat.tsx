import React from 'react';

import type { Participant, RemoteParticipant, Room } from 'livekit-client';
import { RoomEvent, DataPacket_Kind } from 'livekit-client';

export function StreamerChat({ room }: { room: Room }) {
  const [chat, setChat] = React.useState<string[]>([]);
  const [message, setMessage] = React.useState<string>('');

  function sendMessage() {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    room.localParticipant.publishData(data, DataPacket_Kind.RELIABLE);
    setMessage('');
  }

  React.useEffect(() => {
    const handleDataReceived = (payload: Uint8Array, participant?: RemoteParticipant, kind?: DataPacket_Kind) => {
      const decoder = new TextDecoder();
      const message = decoder.decode(payload);
      setChat((prev) => [...prev, message]);
      console.log(message, participant?.identity);
    };
    console.log('adding listener');
    room.on(RoomEvent.DataReceived, handleDataReceived);
    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room]);

  return (
    <div className="w-full h-[200px] border border-gray-500/50 py-2 px-1">
      <div className="flex flex-col space-y-1">
        <div className="w-full h-[150px] overflow-y-scroll">{chat}</div>
        <div className="flex space-x-1">
          <input
            type="text"
            placeholder="Message"
            className="w-full input input-bordered input-sm"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button className="btn btn-outline btn-info btn-sm" onClick={sendMessage}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
