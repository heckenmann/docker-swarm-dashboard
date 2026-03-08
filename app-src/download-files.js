const https = require('node:https')
const http = require('node:http')
const fs = require('node:fs')
const path = require('node:path')

// Read package.json
const packageJson = require('./package.json')

// Check if files array exists in package.json
if (packageJson.files && Array.isArray(packageJson.files)) {
  const files = packageJson.files

  // Create the directory if it doesn't exist
  const targetDirectory = path.join(__dirname, 'src', 'assets')
  if (!fs.existsSync(targetDirectory)) {
    fs.mkdirSync(targetDirectory, { recursive: true })
  }

  const downloadFile = (file, redirectsLeft = 5) =>
    new Promise((resolve, reject) => {
      if (redirectsLeft === 0) {
        reject(new Error(`Too many redirects for ${file.url}`))
        return
      }
      let parsedUrl
      try {
        parsedUrl = new URL(file.url)
      } catch {
        reject(new Error(`Invalid URL: ${file.url}`))
        return
      }
      const transport = parsedUrl.protocol === 'https:' ? https : http
      const dest = path.join(targetDirectory, file.name)
      transport.get(file.url, (res) => {
        // Follow redirects (301/302/307/308)
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          let nextUrl
          try {
            nextUrl = new URL(res.headers.location, file.url).href
          } catch {
            reject(new Error(`Invalid redirect location: ${res.headers.location}`))
            return
          }
          res.resume()
          resolve(downloadFile({ name: file.name, url: nextUrl }, redirectsLeft - 1))
          return
        }
        if (res.statusCode !== 200) {
          res.resume()
          reject(new Error(`HTTP ${res.statusCode} for ${file.url}`))
          return
        }
        const fileStream = fs.createWriteStream(dest)
        res.pipe(fileStream)
        fileStream.on('finish', () => {
          console.log(`${file.name} downloaded successfully!`)
          resolve()
        })
        fileStream.on('error', (err) => {
          fs.unlink(dest, () => {})
          reject(err)
        })
        res.on('error', (err) => {
          fs.unlink(dest, () => {})
          reject(err)
        })
      }).on('error', reject)
    })

  // Download all files
  Promise.all(files.map((f) => downloadFile(f)))
    .then(() => console.log('All files downloaded successfully!'))
    .catch((error) => {
      console.error(`Error: ${error.message}`)
      process.exit(1)
    })
} else {
  console.error('Error: "files" array not found in package.json')
  process.exit(1)
}
