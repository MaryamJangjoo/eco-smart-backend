const io = require('socket.io-client');

const token = 'YOUR_JWT_TOKEN_HERE'; 

const socket = io('http://localhost:3000', {
  auth: { token }, 
  query: { deviceId: 'ESP32_001' },
});

socket.on('connect', () => {
  console.log('✅ Connected!');
});

socket.on('auth_error', (data) => {
  console.log('❌ Auth error:', data);
});

socket.on('connection_ack', (data) => {
  console.log('📨 ACK:', data);
});