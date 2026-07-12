const io = require('socket.io-client');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NDcxMDNiNi1mMTA5LTQ5NjEtYTlkMy0wMjM1NmE1NjcxYWMiLCJ1c2VybmFtZSI6IndlYnNvY2tldF90ZXN0MiIsImlhdCI6MTc4MzgzODM3NiwiZXhwIjoxNzgzODM5Mjc2fQ.86Pr1OE-ethhbSJzWgaNl-Zp7KGexwJBvZKnmzhC-V0';

console.log('🔌 Connecting to WebSocket...');
console.log('📝 Using token:', token.substring(0, 20) + '...');

const socket = io('http://localhost:3000', {
  auth: { token },
  query: { deviceId: 'ESP32_WS_001' },
  transports: ['websocket', 'polling'],
  reconnection: true,      
  reconnectionAttempts: 10, 
  reconnectionDelay: 1000,  
  timeout: 10000,
});

socket.on('connect', () => {
  console.log('✅ Connected!');
  
  setInterval(() => {
    socket.emit('device_data', {
      deviceId: 'ESP32_WS_001',
      data: {
        temperature: 20 + Math.random() * 10,
        humidity: 40 + Math.random() * 30,
        timestamp: new Date()
      }
    });
    console.log('📤 Telemetry sent');
  }, 5000);
});

socket.on('connection_ack', (data) => {
  console.log('📨 ACK:', data);
});

socket.on('live_monitoring', (data) => {
  console.log('📊 Live data:', data);
});

socket.on('auth_error', (data) => {
  console.log('❌ Auth error:', data);
});

socket.on('connect_error', (err) => {
  console.log('❌ Connection error:', err.message);
});

socket.on('disconnect', (reason) => {
  console.log('❌ Disconnected:', reason);
});

socket.on('reconnect', () => {
  console.log('🔄 Reconnected!');
});

socket.on('error', (err) => {
  console.log('❌ Socket error:', err);
});

console.log('⏳ Waiting for data... (Press Ctrl+C to stop)');

setTimeout(() => {
  console.log('⏱️ Closing connection...');
  socket.disconnect();
  process.exit(0);
}, 60000);