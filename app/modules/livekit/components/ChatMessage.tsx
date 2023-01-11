import React from 'react';

import { AiOutlinePlusCircle } from 'react-icons/ai';
import { BsCameraVideo } from 'react-icons/bs';

import type { MessageChat } from './Chat';

export function ChatMessage({ message, room_name }: { message: MessageChat; room_name: string }) {
  return (
    <div className="flex items-center space-x-1">
      {room_name === message.user.nickname ? <BsCameraVideo className="w-5 text-sm" /> : null}

      {room_name === message.user.nickname ? (
        <AiOutlinePlusCircle className="w-5 text-sm hover:cursor-pointer" />
      ) : null}

      <p style={{ color: message.user.chat_color }} className={`text-sm font-bold ml-2`}>
        {message.user.nickname}
      </p>
      <p key={message.id} className="w-[90%] overflow-hidden text-sm text-ellipsis">
        {message.message}
      </p>
    </div>
  );
}
