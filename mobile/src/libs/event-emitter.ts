type Listener = (...args: unknown[]) => void;

class EventEmitter {
  private listeners: Map<string, Listener[]> = new Map();

  on(event: string, listener: Listener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
    return () => this.off(event, listener);
  }

  off(event: string, listener: Listener): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      this.listeners.set(event, listeners.filter((l) => l !== listener));
    }
  }

  emit(event: string, ...args: unknown[]): void {
    this.listeners.get(event)?.forEach((l) => l(...args));
  }
}

export const appEvents = new EventEmitter();
