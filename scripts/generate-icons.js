const fs = require('fs');
const path = require('path');

// Minimal PNG generator - creates a simple colored icon
// PNG file format: signature + IHDR + IDAT + IEND

function createPNG(size) {
  const { deflateSync } = require('zlib');

  // RGBA data
  const width = size;
  const height = size;
  const rawData = Buffer.alloc((width * 4 + 1) * height);

  // Colors
  const primary = [79, 70, 229]; // #4F46E5
  const white = [255, 255, 255];

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (width * 4 + 1);
    rawData[rowOffset] = 0; // Filter: None

    for (let x = 0; x < width; x++) {
      const px = rowOffset + 1 + x * 4;

      // Circle background
      const cx = width / 2;
      const cy = height / 2;
      const r = width / 2 - 1;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);

      if (dist <= r) {
        // Inside circle - primary color
        rawData[px] = primary[0];
        rawData[px + 1] = primary[1];
        rawData[px + 2] = primary[2];
        rawData[px + 3] = 255;

        // Draw "F" letter in white
        const fx = x / width;
        const fy = y / height;

        // Horizontal top bar of F
        if (fy >= 0.25 && fy <= 0.35 && fx >= 0.3 && fx <= 0.7) {
          rawData[px] = white[0];
          rawData[px + 1] = white[1];
          rawData[px + 2] = white[2];
        }
        // Vertical bar of F
        if (fx >= 0.3 && fx <= 0.42 && fy >= 0.25 && fy <= 0.75) {
          rawData[px] = white[0];
          rawData[px + 1] = white[1];
          rawData[px + 2] = white[2];
        }
        // Horizontal middle bar of F
        if (fy >= 0.47 && fy <= 0.55 && fx >= 0.3 && fx <= 0.6) {
          rawData[px] = white[0];
          rawData[px + 1] = white[1];
          rawData[px + 2] = white[2];
        }
      } else {
        // Outside circle - transparent
        rawData[px] = 0;
        rawData[px + 1] = 0;
        rawData[px + 2] = 0;
        rawData[px + 3] = 0;
      }
    }
  }

  // Compress
  const compressed = deflateSync(rawData);

  // Build PNG
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const typeBuffer = Buffer.from(type);
    const crc = crc32(Buffer.concat([typeBuffer, data]));
    const crcBuffer = Buffer.alloc(4);
    crcBuffer.writeUInt32BE(crc >>> 0);
    return Buffer.concat([len, typeBuffer, data, crcBuffer]);
  }

  // CRC32
  function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc ^= buf[i];
      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
      }
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const iconsDir = path.join(process.cwd(), 'public', 'icons');
fs.mkdirSync(iconsDir, { recursive: true });

for (const size of [16, 48, 128]) {
  const png = createPNG(size);
  fs.writeFileSync(path.join(iconsDir, `icon-${size}.png`), png);
  console.log(`Created icon-${size}.png (${png.length} bytes)`);
}
