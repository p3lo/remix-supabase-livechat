import React from 'react';

import { BsCameraVideo } from 'react-icons/bs';

import type { MessageChat } from './Chat';

export function ChatMessage({ message, room_name }: { message: MessageChat; room_name: string }) {
  return (
    <div className="flex space-x-1 items-center">
      {room_name === message.user.nickname ? <BsCameraVideo className="text-sm" /> : null}
      <p style={{ color: message.user.chat_color }} className={`text-sm font-bold ml-2`}>
        {message.user.nickname}
      </p>
      <p key={message.id} className="pl-1 flex flex-row text-sm ">
        {message.message}
      </p>
    </div>
  );
}
