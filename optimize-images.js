const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const imagesDir = path.join(__dirname, 'images');

if (!fs.existsSync(imagesDir)) {
  console.log('No images folder found.');
  process.exit(0);
}

const files = fs.readdirSync(imagesDir).filter(f => /\.(jpg|jpeg|png|gif)$/i.test(f));

if (files.length === 0) {
  console.log('No images found.');
  process.exit(0);
}

console.log(`Found ${files.length} images. Optimizing...`);

let count = 0;

files.forEach(file => {
  const filePath = path.join(imagesDir, file);
  
  sharp(filePath)
    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80, progressive: true })
    .toFile(filePath + '.tmp', (err, info) => {
      if (err) {
        console.error(`Error optimizing ${file}:`, err.message);
        count++;
      } else {
        // Replace original with optimized version
        fs.renameSync(filePath + '.tmp', filePath);
        const originalSize = fs.statSync(filePath).size;
        console.log(`✓ ${file} optimized`);
        count++;
      }
      
      if (count === files.length) {
        console.log('\nAll images optimized!');
        process.exit(0);
      }
    });
});
