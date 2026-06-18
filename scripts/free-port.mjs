import { execSync } from 'child_process';

const port = process.argv[2] || '5000';

function freePortWindows(targetPort) {
  try {
    const out = execSync(`netstat -ano | findstr :${targetPort}`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    });
    const pids = new Set();
    for (const line of out.split('\n')) {
      if (!line.includes('LISTENING')) continue;
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && pid !== '0') pids.add(pid);
    }
    for (const pid of pids) {
      try {
        execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
        if (!process.env.START_QUIET) {
          console.log(`🔓 שוחרר פורט ${targetPort} (PID ${pid})`);
        }
      } catch {
        // process may have already exited
      }
    }
  } catch {
    // port not in use
  }
}

freePortWindows(port);
