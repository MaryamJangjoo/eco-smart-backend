const io = require('socket.io-client');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhN2YxYWRmYi1iZjQ5LTRkY2QtOTZjZi1kY2RiNDM0Y2JlMWMiLCJ1c2VybmFtZSI6IndlYnNvY2tldF90ZXN0IiwiaWF0IjoxNzgzNzcxMTY4LCJleHAiOjE3ODM3NzIwNjh9.T2cbxkNMVvqte96CQeCeyIC_3vdzfkluu1h3z3H6PNA';

const socket = io('http://localhost:3000', {
  auth: { token },
  query: { deviceId: 'ESP32_WS_001' },
});

socket.on('connect', () => {
  console.log('✅ Connected!');
  
  socket.emit('device_data', {
    deviceId: 'ESP32_WS_001',
    data: {
      temperature: 25.5,
      humidity: 60,
      timestamp: new Date()
    }
  });
});

socket.on('connection_ack', (data) => {
  console.log('📨 ACK:', data);
});

socket.on('live_monitoring', (data) => {
  console.log('📊 Live data received:', data);
});

socket.on('auth_error', (data) => {
  console.log('❌ Auth error:', data);
});

setTimeout(() => {
  console.log('⏱️ Closing...');
  socket.disconnect();
  process.exit(0);
}, 5000);