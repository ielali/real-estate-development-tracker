#!/usr/bin/env node
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicDir = join(__dirname, '..', 'public');

async function resizeImages() {
  console.log('🎨 Resizing images to optimal dimensions...\n');

  try {
    // Resize favicon to 32x32 (standard size)
    await sharp(join(publicDir, 'favicon.png'))
      .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(join(publicDir, 'favicon-resized.png'));
    console.log('✅ favicon.png → 32x32 (favicon-resized.png)');

    // Resize logo to reasonable width (keep aspect ratio)
    const logoMetadata = await sharp(join(publicDir, 'logo.png')).metadata();
    const logoWidth = 400; // Reasonable logo width
    const logoHeight = Math.round((logoWidth / logoMetadata.width) * logoMetadata.height);

    await sharp(join(publicDir, 'logo.png'))
      .resize(logoWidth, logoHeight, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(join(publicDir, 'logo-resized.png'));
    console.log(`✅ logo.png → ${logoWidth}x${logoHeight} (logo-resized.png)`);

    // Resize apple-touch-icon to 180x180 (Apple standard)
    await sharp(join(publicDir, 'apple-touch-icon.png'))
      .resize(180, 180, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(join(publicDir, 'apple-touch-icon-resized.png'));
    console.log('✅ apple-touch-icon.png → 180x180 (apple-touch-icon-resized.png)');

    // Resize og-image to 1200x630 (Open Graph standard)
    await sharp(join(publicDir, 'og-image.png'))
      .resize(1200, 630, { fit: 'cover', position: 'center' })
      .png()
      .toFile(join(publicDir, 'og-image-resized.png'));
    console.log('✅ og-image.png → 1200x630 (og-image-resized.png)');

    console.log('\n✨ All images resized successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Review the resized images (*-resized.png files)');
    console.log('2. If satisfied, replace originals:');
    console.log('   mv public/favicon-resized.png public/favicon.png');
    console.log('   mv public/logo-resized.png public/logo.png');
    console.log('   mv public/apple-touch-icon-resized.png public/apple-touch-icon.png');
    console.log('   mv public/og-image-resized.png public/og-image.png');
    console.log('3. Hard refresh browser (Ctrl+Shift+R)');

  } catch (error) {
    console.error('❌ Error resizing images:', error.message);
    process.exit(1);
  }
}

resizeImages();
