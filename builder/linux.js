const packager = require('electron-packager')

async function bundle(options) {
  console.log(`Bundling launcher...`)
  const appPaths = await packager(options)
  console.log(`Electron app bundles created:\n${appPaths.join("\n")}`)
}

bundle(
  {
    dir: './',
    name: 'flexberry-launcher',
    arch: 'x64',
    platform: 'linux',
    out: './build',
    overwrite: true,
    asar: false,
    icon: './builder/assets/icons/icon.png',
    ignore: [
      /^.*(\.github|\.gitignore|LICENSE|README\.md)$/,
      /^.*(builder)$/
    ],
    prune: true
  }
)