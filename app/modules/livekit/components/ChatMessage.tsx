import React from 'react';

import TimeAgo from 'react-timeago';

import type { MessageChat } from './StreamerChat';

export function ChatMessage({ message, room_name }: { message: MessageChat; room_name: string }) {
  return (
    <div className={`flex flex-col ${message.user.nickname === room_name ? 'items-start ' : 'items-end '}`}>
      <div className="w-[80%]">
        <div className="flex justify-between ">
          <p className="text-xs text-gray-400/50 ml-2">{message.user.nickname}</p>
          <TimeAgo className="text-xs mr-2 text-gray-400/50" date={message.createdAt} />
        </div>
        <p key={message.id} className="flex flex-row space-x-2 text-sm border border-gray-500/50 rounded-xl p-1">
          {message.message}
        </p>
      </div>
    </div>
  );
}
