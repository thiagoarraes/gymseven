// Simple test server to bypass tsx/rollup issues
import express from 'express';

const app = express();
const port = parseInt(process.env.PORT || '5000', 10);

app.get('/', (req, res) => {
  res.json({ message: 'GymSeven API Server Running!', status: 'ok' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${port}`);
  console.log(`🔗 Visit: http://localhost:${port}`);
});