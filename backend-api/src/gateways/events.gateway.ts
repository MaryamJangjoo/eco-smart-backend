import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway(3000, {
  cors: { origin: '*' },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`🔌 Client connected: ${client.id}`);
    client.emit('connection_ack', { status: 'connected', id: client.id });
  }

  handleDisconnect(client: Socket) {
    console.log(`❌ Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('device_data')
  handleDeviceData(client: Socket, payload: any) {
    console.log('📦 Device data:', payload);
    this.server.emit('live_monitoring', payload);
  }

  @SubscribeMessage('send_command')
  handleCommand(client: Socket, payload: any) {
    console.log('📨 Command:', payload);
    this.server.to(`device:${payload.deviceId}`).emit('command', payload.command);
  }
}