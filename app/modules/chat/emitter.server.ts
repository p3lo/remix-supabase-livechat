import { EventEmitter } from 'events';
export const EVENTS = {
  MESSAGE_ADDED: 'message',
};
export let emitter = new EventEmitter();
