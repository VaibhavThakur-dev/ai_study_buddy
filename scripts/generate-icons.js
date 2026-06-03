const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const svgPath = path.join(__dirname, '../public/logo-icon.svg')
const svgBuffer = fs.readFileSync(svgPath)

async function generateIcons() {
  await sharp(svgBuffer).resize(192, 192).png().toFile(path.join(__dirname, '../public/icon-192.png'))
  console.log('icon-192.png done')

  await sharp(svgBuffer).resize(512, 512).png().toFile(path.join(__dirname, '../public/icon-512.png'))
  console.log('icon-512.png done')

  await sharp(svgBuffer).resize(180, 180).png().toFile(path.join(__dirname, '../public/icon-180.png'))
  console.log('icon-180.png done')

  await sharp(svgBuffer).resize(32, 32).png().toFile(path.join(__dirname, '../public/favicon.ico'))
  console.log('favicon.ico done')

  console.log('All icons generated successfully!')
}

generateIcons().catch(console.error)
