import { io, Socket } from "socket.io-client";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
} from "@/src/types/socket/events";

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

class SocketManager {
  private socket: TypedSocket | null = null;
  private joinedRooms: Set<string> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 20;
  private onReconnectCallbacks: Array<() => void> = [];
  private onAuthErrorCallbacks: Array<() => void> = [];
  private currentToken: string | null = null;

  connect(token: string): TypedSocket {
    this.currentToken = token;

    if (this.socket?.connected) {
      return this.socket;
    }

    this.disconnect();
    this.reconnectAttempts = 0;

    const url = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000";

    this.socket = io(url, {
      extraHeaders: {
        Authorization: `Bearer ${token}`,
      },
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    }) as unknown as TypedSocket;

    const s = this.socket as unknown as Socket;

    s.on("connect", () => {
      this.reconnectAttempts = 0;
    });

    s.on("connect_error", (err: Error) => {
      this.reconnectAttempts++;
      const isAuthError =
        err.message?.toLowerCase().includes("token") ||
        err.message?.toLowerCase().includes("unauthorized") ||
        err.message?.toLowerCase().includes("401");
      if (isAuthError) {
        for (const cb of this.onAuthErrorCallbacks) {
          cb();
        }
      }
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.disconnect();
      }
    });

    s.on("disconnect", () => {});

    s.on("connected", () => {
      this.rejoinRooms();
    });

    return this.socket;
  }

  updateToken(token: string): void {
    this.currentToken = token;
    if (this.socket?.connected) {
      this.disconnect();
    }
  }

  onReconnect(cb: () => void): () => void {
    this.onReconnectCallbacks.push(cb);
    return () => {
      this.onReconnectCallbacks = this.onReconnectCallbacks.filter(
        (c) => c !== cb,
      );
    };
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
    const s = this.socket as unknown as Socket;
    for (const roomId of this.joinedRooms) {
      s.emit("join:conversation", { conversationId: roomId });
    }
    for (const cb of this.onReconnectCallbacks) {
      cb();
    }
  }

  disconnect(): void {
    this.joinedRooms.clear();
    this.reconnectAttempts = 0;
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.onReconnectCallbacks = [];
    this.onAuthErrorCallbacks = [];
  }

  getSocket(): TypedSocket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  getToken(): string | null {
    return this.currentToken;
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
    const s = this.socket as unknown as Socket;
    const wrapper = handler as (...args: unknown[]) => void;
    s.on(event as string, wrapper);

    return () => {
      s.off(event as string, wrapper);
    };
  }
}

export const socketManager = new SocketManager();
