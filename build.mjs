import { copyFile, mkdir } from 'node:fs/promises';

const output = new URL('./dist/', import.meta.url);
await mkdir(output, { recursive: true });
for (const file of ['index.html', 'styles.css', 'app.js', 'data.js']) {
  await copyFile(new URL(file, import.meta.url), new URL(file, output));
}
console.log('Built static site in dist/');
