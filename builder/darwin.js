const packager = require('electron-packager')

async function bundle(options) {
  console.log(`Bundling launcher...`)
  const appPaths = await packager(options)
  console.log(`Electron app bundles created:\n${appPaths.join("\n")}`)
}

bundle(
  {
    dir: './',
    name: 'Flexberry Launcher',
    arch: 'x64',
    platform: 'darwin',
    out: './build',
    overwrite: true,
    asar: false,
    icon: './builder/assets/icons/icon.icns',
    ignore: [
      /^.*(accounts\.json|\.github|\.gitignore|LICENSE|README\.md)$/,
      /^.*(builder)$/
    ],
    prune: true
  }
)