const packager = require('electron-packager');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
require('asar');

const platformConfigs = {
  "win32": {
    platform: 'win32',
    icon: './builder/assets/icons/icon.ico',
  },
  "linux": {
    platform: 'linux',
    icon: './builder/assets/icons/icon.png',
  },
  "common": {
    dir: './',
    name: 'flexberry-launcher',
    arch: 'x64',
    out: './build',
    overwrite: true,
    asar: false,
    ignore: [
      /^.*(\.github|\.gitignore|LICENSE|README\.md)$/,
      /^.*(builder)$/
    ],
    prune: true
  }
};

(async () => {
  const platform = process?.argv[2]?.split('=')[1];
  if (!platformConfigs[platform]) {
    console.log(`Unknown platform: ${platform}`);
    return;
  }
  const options = {
    ...platformConfigs.common,
    ...platformConfigs[platform],
  };
  const startTime = Date.now();
  console.log(`Bundling Flexberry Launcher for ${platform}`);
  const appPaths = (await packager(options))[0];
  console.log(`Bundling Flexberry Launcher for ${platform} completed`);
  console.log("Packing to asar");
  const appFolderPath = path.join(__dirname, "..", appPaths, "resources");
  exec(`npx asar pack app app.asar`, { cwd: appFolderPath }, (err, stdout, stderr) => {
    if (err && stderr) {
      console.log(err || stderr);
      return;
    }
    console.log("Packing to asar completed");
    console.log("Removing app folder");
    fs.rmSync(path.join(appFolderPath, "app"), { recursive: true });
    console.log("Removing app folder completed");
    console.log(`Bundling Flexberry Launcher for ${platform} completed in ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
  });
})();