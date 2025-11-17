import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';

@Injectable()
export class AppGateway {
  protected readonly connectedUsers = new Map<string, string>(); // userId -> socketId
  protected readonly userSockets = new Map<string, string>(); // socketId -> userId
  private readonly logger = new Logger(AppGateway.name);

  constructor(protected readonly jwt: JwtService) {}

  /**
   * Authenticates the client, registers the socket and joins the user room.
   * Returns the authenticated userId or null if authentication fails.
   */
  protected async establishConnection(client: Socket): Promise<string | null> {
    try {
      const token = this.extractToken(client);
      if (!token) {
        client.disconnect(true);
        return null;
      }

      const decoded: any = this.jwt.verify(token, {
        secret: process.env.JWT_SECRET
      });

      if (!decoded?.sub) {
        client.disconnect(true);
        return null;
      }

      const userId = String(decoded.sub);
      this.connectedUsers.set(userId, client.id);
      this.userSockets.set(client.id, userId);

      await client.join(`user:${userId}`);
      this.notifyClientConnected(client, userId);

      return userId;
    } catch (error) {
      this.handleConnectionError(client, error);
      return null;
    }
  }

  /**
   * Cleans up references for a disconnected client.
   * Returns the previously associated userId if any.
   */
  protected async releaseConnection(client: Socket): Promise<string | undefined> {
    const userId = this.userSockets.get(client.id);
    if (userId) {
      this.connectedUsers.delete(userId);
      this.userSockets.delete(client.id);
    }
    return userId;
  }

  /**
   * Helper to fetch the authenticated userId for the given socket.
   */
  protected getUserIdFromClient(client: Socket): string | undefined {
    return this.userSockets.get(client.id);
  }

  protected getOnlineUserIds(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  protected isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  private extractToken(client: Socket): string | null {
    const token = client.handshake.auth?.token || client.handshake.query?.token;
    if (!token) {
      return null;
    }
    return token.replace(/^Bearer\s+/i, '');
  }

  protected notifyClientConnected(client: Socket, userId: string) {
    client.emit('connected', { userId, timestamp: new Date() });
  }

  protected handleConnectionError(client: Socket, error: unknown) {
    if (error instanceof Error) {
      this.logger.error('WebSocket connection error', error.stack);
    } else {
      this.logger.error(`WebSocket connection error: ${error}`);
    }
    client.disconnect(true);
  }
}

