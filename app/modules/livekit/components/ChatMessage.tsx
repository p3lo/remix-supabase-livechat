import React from 'react';

import { BsCameraVideo } from 'react-icons/bs';

import type { MessageChat } from './StreamerChat';

export function ChatMessage({ message, room_name }: { message: MessageChat; room_name: string }) {
  const [chatColor] = React.useState<string>('text-[' + message.user.chat_color + ']');
  return (
    <div className="flex space-x-1 items-center">
      {room_name === message.user.nickname ? <BsCameraVideo className="text-sm" /> : null}
      <p className={`text-sm font-bold ${chatColor} ml-2`}>{message.user.nickname}</p>
      <p className="text-sm">:</p>
      <p key={message.id} className="pl-1 flex flex-row text-sm ">
        {message.message}
      </p>
    </div>
  );
}
