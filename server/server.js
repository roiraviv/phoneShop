import 'dotenv/config';
import app from './app.js';
import { initStorage } from './storage/jsonStore.js';

const PORT = process.env.PORT || 5000;

async function startServer() {
  await initStorage();

  const server = app.listen(PORT, () => {
    console.log(`🚀 שרת פועל על http://localhost:${PORT}`);
    console.log(`📊 דשבורד: http://localhost:${PORT}/api/analytics/dashboard`);
    console.log(`🛒 POS:      http://localhost:${PORT}/api/sales`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ פורט ${PORT} תפוס! עצור את השרת הישן: taskkill /PID <pid> /F`);
      console.error('   או הרץ: netstat -ano | findstr :5000');
    } else {
      console.error('❌ שגיאת שרת:', err.message);
    }
    process.exit(1);
  });
}

startServer();
