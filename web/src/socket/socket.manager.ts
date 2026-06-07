import { io, Socket } from "socket.io-client";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
} from "@/src/types/socket/events";

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const MAX_RECONNECT_ATTEMPTS = 20;
const INITIAL_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 5000;

class SocketManager {
  private socket: TypedSocket | null = null;
  private joinedRooms: Set<string> = new Set();
  private reconnectAttempts = 0;
  private onAuthErrorCallbacks: Array<() => void> = [];

  connect(): TypedSocket {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.disconnect();
    this.reconnectAttempts = 0;

    const url = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000";

    this.socket = io(url, {
      withCredentials: true,
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: INITIAL_RECONNECT_DELAY,
      reconnectionDelayMax: MAX_RECONNECT_DELAY,
    }) as unknown as TypedSocket;

    const s = this.socket as unknown as Socket;

    s.on("connect", () => {
      this.reconnectAttempts = 0;
      this.rejoinRooms();
    });

    s.on("connect_error", (err: Error) => {
      this.reconnectAttempts++;
      const message = err.message?.toLowerCase() || "";
      const isAuthError =
        message.includes("token") ||
        message.includes("unauthorized") ||
        message.includes("401");
      if (isAuthError) {
        for (const cb of this.onAuthErrorCallbacks) {
          cb();
        }
      }
      if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        this.disconnect();
      }
    });

    s.on("connected", () => {
      this.rejoinRooms();
    });

    return this.socket;
  }

  reconnect(): void {
    if (this.socket) {
      this.socket.connect();
      this.rejoinRooms();
    } else {
      this.connect();
    }
  }

  onAuthError(cb: () => void): () => void {
    this.onAuthErrorCallbacks.push(cb);
    return () => {
      this.onAuthErrorCallbacks = this.onAuthErrorCallbacks.filter(
        (c) => c !== cb,
      );
    };
  }

  private rejoinRooms(): void {
    for (const roomId of this.joinedRooms) {
      (this.socket as unknown as Socket).emit("join:conversation", {
        conversationId: roomId,
      });
    }
  }

  disconnect(): void {
    this.reconnectAttempts = 0;
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  }

  fullCleanup(): void {
    this.joinedRooms.clear();
    this.onAuthErrorCallbacks = [];
    this.disconnect();
  }

  getSocket(): TypedSocket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  joinConversation(conversationId: string): void {
    if (!this.socket?.connected) return;
    if (this.joinedRooms.has(conversationId)) return;
    (this.socket as unknown as Socket).emit("join:conversation", {
      conversationId,
    });
    this.joinedRooms.add(conversationId);
  }

  leaveConversation(conversationId: string): void {
    if (!this.joinedRooms.has(conversationId)) return;
    (this.socket as unknown as Socket).emit("leave:conversation", {
      conversationId,
    });
    this.joinedRooms.delete(conversationId);
  }

  startTyping(conversationId: string): void {
    if (!this.socket?.connected) return;
    (this.socket as unknown as Socket).emit("typing:start", {
      conversationId,
    });
  }

  stopTyping(conversationId: string): void {
    if (!this.socket?.connected) return;
    (this.socket as unknown as Socket).emit("typing:stop", {
      conversationId,
    });
  }

  markAsRead(conversationId: string, messageId: string): void {
    if (!this.socket?.connected) return;
    (this.socket as unknown as Socket).emit("message:read", {
      conversationId,
      messageId,
    });
  }

  on<E extends keyof ServerToClientEvents>(
    event: E,
    handler: ServerToClientEvents[E],
  ): () => void {
    if (!this.socket) {
      return () => {};
    }
    const s = this.socket as unknown as Socket;
    const wrapper = handler as (...args: unknown[]) => void;
    s.on(event as string, wrapper);

    return () => {
      s.off(event as string, wrapper);
    };
  }
}

export const socketManager = new SocketManager();
