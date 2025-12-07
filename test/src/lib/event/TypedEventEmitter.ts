export default class TypedEventEmitter<T extends Record<string, unknown>> {
  private listeners: { [k in keyof T]?: ((arg: T[k]) => void)[] } = {};

  on<k extends keyof T>(event: k, listener: (arg: T[k]) => void) {
    (this.listeners[event] || []).push(listener);
  }

  off<k extends keyof T>(event: k, listener: (arg: T[k]) => void) {
    this.listeners[event] = this.listeners[event]?.filter(
      (l) => l !== listener
    );
  }

  emit<k extends keyof T>(event: k, arg: T[k]) {
    const listeners = this.listeners[event];
    if (!listeners) return;

    for (const listener of listeners) {
      listener(arg);
    }
  }
}
