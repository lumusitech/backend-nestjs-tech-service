import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';

interface JwtPayload {
  sub: string;
  role: string;
}

interface SocketData {
  userId?: string;
}

@WebSocketGateway({
  cors: { origin: '*' },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private readonly connectedUsers = new Map<string, Socket>();

  constructor(private readonly jwtService: JwtService) {}

  handleConnection(client: Socket): void {
    try {
      const token =
        (client.handshake.auth as Record<string, string>)?.token ||
        (client.handshake.query as Record<string, string>)?.token;

      if (!token) {
        this.logger.warn('Connection rejected: no token provided');
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify<JwtPayload>(token);
      const userId = payload.sub;

      this.connectedUsers.set(userId, client);
      (client.data as SocketData).userId = userId;

      this.logger.log(`Client connected: ${userId}`);
    } catch {
      this.logger.warn('Connection rejected: invalid token');
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    const data = client.data as SocketData;
    const userId = data.userId;
    if (userId) {
      this.connectedUsers.delete(userId);
      this.logger.log(`Client disconnected: ${userId}`);
    }
  }

  emitToUser(userId: string, event: string, data: unknown): void {
    const socket = this.connectedUsers.get(userId);
    if (socket) {
      socket.emit(event, data);
    }
  }

  emitToAll(event: string, data: unknown): void {
    this.server.emit(event, data);
  }
}
