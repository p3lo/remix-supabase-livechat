import React from 'react';

import { useFetcher, useMatches } from '@remix-run/react';
import type { Room } from 'livekit-client';
import { useEventSource, useDataRefresh } from 'remix-utils';

import { ChatMessage } from './ChatMessage';

export interface MessageChat {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  room: string;
  message: string;
  user: {
    nickname: string;
  };
}

export function StreamerChat({ room, user }: { room: Room; user: { id: string; nickname: string; role: string } }) {
  const get_messages: MessageChat[] = useMatches()[2].data.messages;
  const send_message = useFetcher();
  const [message, setMessage] = React.useState<string>('');

  let lastMessageId = useEventSource('/chat/subscribe', {
    event: 'message-new',
  });

  let { refresh } = useDataRefresh();

  React.useEffect(() => {
    refresh();
  }, [lastMessageId]);

  function sendMessage() {
    send_message.submit({ message, room: room.name, user_id: user.id }, { method: 'post', action: `/${room.name}` });
    setMessage('');
  }

  return (
    <div className="w-full h-[200px] border border-gray-500/50 py-2 px-1">
      <div className="flex flex-col space-y-1">
        <div className="h-[150px] overflow-y-scroll flex flex-col space-y-1">
          {get_messages.map((message) => (
            <ChatMessage key={message.id} message={message} room_name={room.name} />
          ))}
        </div>
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
