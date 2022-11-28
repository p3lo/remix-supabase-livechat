import React from 'react';

import { useParticipant, useRoom } from '@livekit/react-core';
import type { Participant } from 'livekit-client';
import { ConnectionState, LocalParticipant } from 'livekit-client';

import { ViewerVideo } from './ViewerVideo';

export function Viewer({
  user,
  token,
  server,
}: {
  user: { id: string; nickname: string; role: string };
  token: string;
  server: string;
}) {
  const { room, connect } = useRoom();
  const [streamerInfo, setStreamerInfo] = React.useState<Participant | undefined>(undefined);

  async function init() {
    const connectedRoom = await connect(server, token);
    if (!connectedRoom) {
      return;
    }
    if (connectedRoom.state === ConnectionState.Connected) {
      const streamer = room?.getParticipantByIdentity(room.name);
      if (streamer) {
        setStreamerInfo(streamer);
      }
    }
  }

  React.useEffect(() => {
    init().catch(console.error);
  }, []);

  return <>{streamerInfo ? <ViewerVideo streamerinfo={streamerInfo} room={room} /> : null}</>;
}
