import type { LoaderArgs } from '@remix-run/node';
import { eventStream } from 'remix-utils';

import { emitter, EVENTS } from '../../modules/chat/emitter.server';

export const loader = async ({ request }: LoaderArgs) =>
  eventStream(request.signal, (send) => {
    const handler = (message: string) => {
      send({ data: message });
      console.log('🚀 ~ file: chat-subscribe.ts:10 ~ handler ~ message', message);
    };

    emitter.addListener(EVENTS.MESSAGE_ADDED, handler);
    return () => {
      emitter.removeListener(EVENTS.MESSAGE_ADDED, handler);
    };
  });
