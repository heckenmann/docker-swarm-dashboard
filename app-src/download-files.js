// Generated with chatgpt
const axios = require('axios')
const fs = require('fs')
const path = require('path')

// Read package.json
const packageJson = require('./package.json')

// Check if files array exists in package.json
if (packageJson.files && Array.isArray(packageJson.files)) {
  const files = packageJson.files

  // Create the directory if it doesn't exist
  const targetDirectory = path.join(__dirname, 'src', 'files')
  if (!fs.existsSync(targetDirectory)) {
    fs.mkdirSync(targetDirectory, { recursive: true })
  }

  const downloadFile = async (file) => {
    try {
      const response = await axios.get(file.url, {
        responseType: 'arraybuffer',
      })
      fs.writeFileSync(
        path.join(targetDirectory, file.name),
        Buffer.from(response.data),
      )
      console.log(`${file.name} downloaded successfully!`)
    } catch (error) {
      console.error(`Error downloading ${file.name}: ${error.message}`)
    }
  }

  // Download all files
  Promise.all(files.map(downloadFile))
    .then(() => console.log('All files downloaded successfully!'))
    .catch((error) => console.error(`Error: ${error.message}`))
} else {
  console.error('Error: "files" array not found in package.json')
}
