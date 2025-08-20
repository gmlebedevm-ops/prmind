const { spawn } = require('child_process');

// Запускаем Next.js dev сервер
const nextDev = spawn('npx', ['next', 'dev'], {
  stdio: 'inherit',
  shell: true
});

nextDev.on('error', (error) => {
  console.error('Error starting Next.js dev server:', error);
});

nextDev.on('close', (code) => {
  console.log(`Next.js dev server exited with code ${code}`);
});

// Обработка завершения процесса
process.on('SIGINT', () => {
  console.log('Stopping Next.js dev server...');
  nextDev.kill('SIGINT');
  process.exit(0);
});