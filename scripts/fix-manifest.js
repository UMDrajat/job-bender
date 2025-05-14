const fs = require('fs');
const path = require('path');

const manifestPath = path.join(__dirname, '../dist/manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

// Helper to remove 'dist/' prefix
function stripDistPrefix(p) {
  return p.replace(/^dist\//, '');
}

// Fix background service worker
if (manifest.background && manifest.background.service_worker) {
  manifest.background.service_worker = stripDistPrefix(manifest.background.service_worker);
}

// Fix action default_popup
if (manifest.action && manifest.action.default_popup) {
  manifest.action.default_popup = stripDistPrefix(manifest.action.default_popup);
}

// Fix web_accessible_resources
if (Array.isArray(manifest.web_accessible_resources)) {
  manifest.web_accessible_resources.forEach(resourceObj => {
    if (Array.isArray(resourceObj.resources)) {
      resourceObj.resources = resourceObj.resources.map(stripDistPrefix);
    }
  });
}

// Write the fixed manifest back
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log('Fixed manifest.json for dist/'); 