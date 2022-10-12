export enum Events {
  EVENT_SCROLL_TOP_MAIN_CONTAINER = 'EVENT_SCROLL_TOP_MAIN_CONTAINER',
  EVENT_CLOSE_MODAL = 'EVENT_CLOSE_MODAL',
  EVENT_APP_MESSAGE = 'EVENT_APP_MESSAGE',
}

export const EventEmitter = {
  _events: {} as Record<Events, ((data: any) => any)[]>,
  dispatch(event: Events, data?: any) {
    if (!this._events[event]) return;
    this._events[event].forEach((callback) => callback(data));
  },
  subscribe(event: Events, callback: (data: any) => any) {
    if (!this._events[event]) this._events[event] = [];
    this._events[event].push(callback);
  },
  unsubscribe(event: Events) {
    if (!this._events[event]) return;
    delete this._events[event];
  },
};
