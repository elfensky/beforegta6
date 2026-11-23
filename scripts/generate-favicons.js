import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = new URL('../', import.meta.url);
const source = await readFile(new URL('public/favicon.svg', root));
const sizes = [16, 32, 48];
const images = await Promise.all(
  sizes.map((size) => sharp(source, { density: 576 }).resize(size, size).png().toBuffer()),
);

const directory = Buffer.alloc(6 + sizes.length * 16);
directory.writeUInt16LE(1, 2);
directory.writeUInt16LE(sizes.length, 4);
let offset = directory.length;
for (const [index, image] of images.entries()) {
  const entry = 6 + index * 16;
  directory.writeUInt8(sizes[index], entry);
  directory.writeUInt8(sizes[index], entry + 1);
  directory.writeUInt16LE(1, entry + 4);
  directory.writeUInt16LE(32, entry + 6);
  directory.writeUInt32LE(image.length, entry + 8);
  directory.writeUInt32LE(offset, entry + 12);
  offset += image.length;
}

await writeFile(new URL('public/favicon.ico', root), Buffer.concat([directory, ...images]));
await sharp(source, { density: 576 })
  .resize(180, 180)
  .flatten({ background: '#140a1f' })
  .png()
  .toFile(fileURLToPath(new URL('public/apple-touch-icon.png', root)));
await mkdir(new URL('docs/brand/', root), { recursive: true });
await sharp(source, { density: 576 })
  .resize(512, 512)
  .png()
  .toFile(fileURLToPath(new URL('docs/brand/favicon.png', root)));
