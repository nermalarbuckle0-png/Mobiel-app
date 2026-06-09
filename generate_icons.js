const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let crc = 0xffffffff;
  for (const byte of buf) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function makePng(file, size, bg, fg) {
  const width = size;
  const height = size;
  const bytes = [];
  for (let y = 0; y < height; y++) {
    bytes.push(0);
    for (let x = 0; x < width; x++) {
      let [r, g, b, a] = bg;
      const dx = x - width / 2;
      const dy = y - height / 2;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < width * 0.38) {
        [r, g, b, a] = fg;
      } else if (dist < width * 0.44) {
        [r, g, b, a] = [255, 255, 255, 180];
      }
      bytes.push(r, g, b, a);
    }
  }
  const raw = Buffer.from(bytes);
  const compressed = zlib.deflateSync(raw);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8);
  ihdr.writeUInt8(6, 9);
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);
  const png = Buffer.concat([
    Buffer.from('\x89PNG\r\n\x1a\n'),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0))
  ]);
  fs.writeFileSync(file, png);
}

const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });
makePng(path.join(iconsDir, 'icon-192.png'), 192, [76,217,100,255], [255,255,255,255]);
makePng(path.join(iconsDir, 'icon-512.png'), 512, [76,217,100,255], [255,255,255,255]);
console.log('created icons/icon-192.png and icons/icon-512.png');
