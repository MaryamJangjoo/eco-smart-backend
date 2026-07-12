import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: { origin: '*' },
  transports: ['websocket', 'polling'],
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || 
                     client.handshake.query?.token as string;

      if (!token) {
        console.log('❌ No token provided, disconnecting...');
        client.emit('auth_error', { message: 'Token required' });
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_ACCESS_SECRET'),
      });

      client.data.userId = payload.sub;
      client.data.username = payload.username;
      client.data.role = payload.role;

      console.log(`🔌 Authenticated user: ${payload.username}`);
      client.emit('connection_ack', { 
        status: 'authenticated', 
        user: payload.username 
      });

    } catch (error) {
      console.log('❌ Invalid token, disconnecting...');
      client.emit('auth_error', { message: 'Invalid or expired token' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`❌ Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('device_data')
  handleDeviceData(client: Socket, payload: any) {
    if (!client.data.userId) {
      client.emit('error', { message: 'Unauthorized' });
      return;
    }

    console.log(`📦 Device data from ${client.data.username}:`, payload);
    this.server.emit('live_monitoring', payload);
  }

  @SubscribeMessage('send_command')
  handleCommand(client: Socket, payload: any) {
    if (!client.data.userId) {
      client.emit('error', { message: 'Unauthorized' });
      return;
    }

    console.log(`📨 Command from ${client.data.username}:`, payload);
    this.server.to(`device:${payload.deviceId}`).emit('command', payload.command);
  }
}