import os, zlib, struct

def make_png(path, size, bg, fg):
    width = height = size
    pixels = bytearray()
    for y in range(height):
        pixels.append(0)
        for x in range(width):
            r, g, b, a = bg
            dx = x - width/2
            dy = y - height/2
            dist = (dx*dx + dy*dy)**0.5
            if dist < width*0.38:
                r, g, b, a = fg
            elif dist < width*0.44:
                r, g, b, a = (255, 255, 255, 180)
            pixels.extend([r, g, b, a])
    raw = zlib.compress(bytes(pixels))
    def chunk(type_, data):
        return struct.pack('>I', len(data)) + type_.encode('ascii') + data + struct.pack('>I', zlib.crc32(type_.encode('ascii') + data) & 0xffffffff)
    png = b'\x89PNG\r\n\x1a\n'
    ihdr = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    png += chunk('IHDR', ihdr)
    png += chunk('IDAT', raw)
    png += chunk('IEND', b'')
    with open(path, 'wb') as f:
        f.write(png)

icons_dir = 'icons'
os.makedirs(icons_dir, exist_ok=True)
make_png(os.path.join(icons_dir, 'icon-192.png'), 192, (76, 217, 100, 255), (255,255,255,255))
make_png(os.path.join(icons_dir, 'icon-512.png'), 512, (76, 217, 100, 255), (255,255,255,255))
print('created icons/icon-192.png and icons/icon-512.png')
