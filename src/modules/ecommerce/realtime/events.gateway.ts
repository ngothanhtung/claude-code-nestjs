import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(EventsGateway.name);

  @WebSocketServer() server: Server;
  private users: Map<string, { id: string }> = new Map();

  handleConnection(socket: Socket) {
    console.log('User connected:', socket.id);
    this.users.set(socket.id, { id: socket.id });

    // Broadcast to all users when a new user joins
    socket.broadcast.emit('user-connected', socket.id);

    // Send list of all connected users to the new user
    socket.emit('users-list', Array.from(this.users.keys()));
  }

  handleDisconnect(socket: Socket) {
    console.log('User disconnected:', socket.id);
    this.users.delete(socket.id);
    this.server.emit('user-disconnected', socket.id);
  }

  @SubscribeMessage('sendMessage')
  handleSendMessage(socket: Socket, data: { user: string; text: string }) {
    const { user, text } = data;
    this.logger.log(`Message from ${user}: ${text}`);
    this.server.emit('message', { user, text });
    return { status: 'ok' };
  }
}
