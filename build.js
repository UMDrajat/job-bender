const esbuild = require('esbuild');

esbuild.build({
  entryPoints: [
    'background.js',
    'popup.js',
    'auth.js',
    'storage.js',
    'services/applications.js',
    // add more entry points if needed
  ],
  bundle: true,
  outdir: 'dist',
  format: 'esm',
  target: ['chrome110'], // adjust as needed
  sourcemap: true,
  minify: false,
  loader: { '.js': 'js' },
}).catch(() => process.exit(1)); 