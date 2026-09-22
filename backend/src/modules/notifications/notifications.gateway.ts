import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
})
@Injectable()
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    // Client connected
  }

  handleDisconnect(client: Socket) {
    // Client disconnected
  }

  @SubscribeMessage('join:room')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { room: string },
  ) {
    if (data?.room) {
      client.join(data.room);
    }
    return { status: 'joined', room: data.room };
  }

  broadcastToAdmins(event: string, payload: any) {
    if (this.server) {
      this.server.to('admin-room').emit(event, payload);
    }
  }

  broadcastToDepartment(department: string, event: string, payload: any) {
    if (this.server) {
      const room = `dept-${department.toLowerCase()}`;
      this.server.to(room).emit(event, payload);
    }
  }

  broadcastToPilot(userId: string, event: string, payload: any) {
    if (this.server) {
      this.server.to(`pilot-${userId}`).emit(event, payload);
    }
  }

  broadcastAll(event: string, payload: any) {
    if (this.server) {
      this.server.emit(event, payload);
    }
  }

  broadcastCorridorAlert(alert: {
    id: string;
    title: string;
    message: string;
    sourceRole: string;
    sourceDepartment?: string;
    targetAudience: string;
    targetRoles?: string[];
    severity?: string;
    segmentLabel?: string;
    priorityScore?: number;
    details?: string;
    requestId?: string;
    sound?: 'alarm' | 'emergency' | 'warning' | 'chime';
    timestamp?: string;
  }) {
    if (this.server) {
      this.server.emit('corridor:alert', alert);
    }
  }
}

