import type { LoaderArgs } from '@remix-run/node';
import { eventStream } from 'remix-utils';

import { emitter } from '../../modules/chat/emitter.server';

export const loader = async ({ request }: LoaderArgs) =>
  eventStream(request.signal, function setup(send) {
    const handler = (message: string) => {
      send({ event: 'new-message', data: message });
    };

    emitter.on('new_message', handler);
    return function clear() {
      emitter.off('new_message', handler);
    };
  });
