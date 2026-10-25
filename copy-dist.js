import fs from 'fs';
import path from 'path';

const distPath = path.resolve('dist/index.html');
const targetPath = path.resolve('homepage.html');

if (fs.existsSync(distPath)) {
  fs.copyFileSync(distPath, targetPath);
  console.log('✅ Successfully copied dist/index.html to homepage.html');
} else {
  console.error('❌ dist/index.html not found');
}
