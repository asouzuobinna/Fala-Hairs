// utils/imageOptimizer.js
const path = require('path');
const fs = require('fs');

// Sharp is optional — graceful fallback if not installed
let sharp;
try { sharp = require('sharp'); } catch { sharp = null; }

async function optimizeImage(inputPath, outputDir, baseName) {
  const sizes = [
    { suffix: 'small', width: 400 },
    { suffix: 'medium', width: 800 },
    { suffix: 'large', width: 1200 },
  ];

  const results = [];

  if (!sharp) {
    // Fallback: just copy the file
    for (const s of sizes) {
      const outName = `${baseName}_${s.suffix}.webp`;
      const outPath = path.join(outputDir, outName);
      fs.copyFileSync(inputPath, outPath);
      results.push({ size: s.suffix, file: outName });
    }
    return results;
  }

  for (const s of sizes) {
    const outName = `${baseName}_${s.suffix}.webp`;
    const outPath = path.join(outputDir, outName);
    await sharp(inputPath)
      .resize(s.width, null, { withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(outPath);
    results.push({ size: s.suffix, file: outName });
  }

  return results;
}

module.exports = { optimizeImage };
