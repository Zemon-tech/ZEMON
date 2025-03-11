const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

const SOURCE_SVG = path.join(__dirname, '../public/icons/source.svg');
const PUBLIC_DIR = path.join(__dirname, '../public');

const ICONS = [
  { name: 'android-chrome-192x192.png', size: 192 },
  { name: 'android-chrome-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'favicon.png', size: 32 }, // Main favicon
];

async function generateIcons() {
  try {
    const sourceBuffer = await fs.readFile(SOURCE_SVG);

    for (const icon of ICONS) {
      // First create a white background
      const background = await sharp({
        create: {
          width: icon.size,
          height: icon.size,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        }
      })
      .png()
      .toBuffer();

      // Calculate padding (10% of icon size)
      const padding = Math.max(Math.floor(icon.size * 0.1), 1);
      const logoSize = icon.size - (padding * 2);

      // Process the logo
      const logo = await sharp(sourceBuffer)
        .resize(logoSize, logoSize, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .tint({ r: 0, g: 0, b: 0 })
        .toBuffer();

      // Composite logo onto the white background
      await sharp(background)
        .composite([{
          input: logo,
          gravity: 'center'
        }])
        .png()
        .toFile(path.join(PUBLIC_DIR, icon.name));
      
      console.log(`Generated ${icon.name}`);
    }
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();