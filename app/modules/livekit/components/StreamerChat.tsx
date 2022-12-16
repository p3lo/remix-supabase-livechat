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
    chat_color: string;
  };
}

export function StreamerChat({ room, user }: { room: string; user: { id: string; nickname: string; role: string } }) {
  const get_messages: MessageChat[] = useMatches()[2].data.messages;
  const send_message = useFetcher();
  const [message, setMessage] = React.useState<string>('');
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = (element: HTMLDivElement) => {
    element.scrollTo(0, element.scrollHeight);
  };

  let lastMessageId = useEventSource('/chat/subscribe', {
    event: 'message-new',
  });

  let { refresh } = useDataRefresh();

  React.useEffect(() => {
    scrollToBottom(messagesEndRef.current!);
  }, [get_messages]);

  React.useEffect(() => {
    refresh();
    scrollToBottom(messagesEndRef.current!);
  }, [lastMessageId]);

  function sendMessage() {
    send_message.submit({ message, room: room, user_id: user.id }, { method: 'post', action: `/${room}` });
    setMessage('');
  }
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full space-y-2 border border-gray-500/50 py-2 px-1 overflow-y-hidden">
      <div
        ref={messagesEndRef}
        className=" flex flex-col space-y-1 overflow-y-scroll scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-400 scrollbar-thumb-rounded-full scrollbar-track-rounded-full "
      >
        {get_messages
          .slice()
          .reverse()
          .map((message) => (
            <ChatMessage key={message.id} message={message} room_name={room} />
          ))}
      </div>
      <div className="flex space-x-1">
        <input
          type="text"
          placeholder="Message"
          className="w-full input input-bordered input-sm"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button className="btn btn-outline btn-info btn-sm" onClick={sendMessage}>
          Send
        </button>
      </div>
    </div>
  );
}
