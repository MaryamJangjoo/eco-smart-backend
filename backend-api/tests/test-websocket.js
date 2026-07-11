const io = require('socket.io-client');

console.log('🔌 Connecting to WebSocket on port 3000...');

const socket = io('http://localhost:3000', {  // ← پورت 3000
  query: { deviceId: 'ESP32_001' },
  transports: ['websocket', 'polling'],
});

socket.on('connect', () => {
  console.log('✅ Connected!');
  socket.emit('device_data', {
    deviceId: 'ESP32_001',
    data: { temperature: 25.5, humidity: 60 }
  });
});

socket.on('connection_ack', (data) => {
  console.log('📨 ACK:', data);
});

socket.on('live_monitoring', (data) => {
  console.log('📊 Live data:', data);
});

socket.on('connect_error', (err) => {
  console.log('❌ Error:', err.message);
});

setTimeout(() => {
  console.log('⏱️ Closing...');
  socket.disconnect();
  process.exit(0);
}, 5000);