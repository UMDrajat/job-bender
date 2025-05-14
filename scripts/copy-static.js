const fs = require('fs');
const path = require('path');

const filesToCopy = [
  'popup.html',
  'jobs.html',
  'styles.css',
  'jquery-3.7.1.min.js',
  'content.js',
];

const dirsToCopy = [
  'images',
  'icons',
];

const distDir = path.join(__dirname, '../dist');

function copyFile(src, dest) {
  fs.copyFileSync(src, dest);
  console.log(`Copied ${src} -> ${dest}`);
}

function copyDir(srcDir, destDir) {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  fs.readdirSync(srcDir).forEach(item => {
    const srcPath = path.join(srcDir, item);
    const destPath = path.join(destDir, item);
    if (fs.lstatSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copied ${srcPath} -> ${destPath}`);
    }
  });
}

// Copy individual files
filesToCopy.forEach(file => {
  const src = path.join(__dirname, '../', file);
  const dest = path.join(distDir, file);
  if (fs.existsSync(src)) {
    copyFile(src, dest);
  }
});

// Copy directories
dirsToCopy.forEach(dir => {
  const src = path.join(__dirname, '../', dir);
  const dest = path.join(distDir, dir);
  if (fs.existsSync(src)) {
    copyDir(src, dest);
  }
}); 