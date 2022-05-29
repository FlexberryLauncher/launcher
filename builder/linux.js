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
    overwrite: false,
    asar: false,
    icon: './icon.ico',
    ignore: [
      /^.*(accounts\.json|\.github|\.gitignore|LICENSE|README\.md)$/,
      /^.*(builder)$/
    ],
    prune: true
  }
)