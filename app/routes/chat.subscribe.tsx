import type { LoaderArgs } from '@remix-run/node';
import { eventStream } from 'remix-utils';

import { chatEmitter } from '../modules/chat/emitter.server';

// eslint-disable-next-line arrow-body-style
export async function loader({ request }: LoaderArgs) {
  return eventStream(request.signal, function setup(send) {
    function handle(message: string) {
      send({ event: 'message-new', data: message });
    }

    chatEmitter.on('message', handle);

    return function clear() {
      chatEmitter.off('message', handle);
    };
  });
}
