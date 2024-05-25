import { green, redBright } from 'colorette'
import fs from 'fs'
import path from 'path'
import { channel } from './deploy'

export const handleGetDirectories = async () => {
  const rootDir = path.resolve(__dirname) // Get the absolute path of the root directory
  try {
    const allFiles = getAllFiles(rootDir)
    console.log(green('Retrieved all file paths successfully'))
    channel.send({
      event: 'return-all-files',
      type: 'broadcast',
      payload: { files: allFiles },
    })
  } catch (error) {
    console.log(redBright('Failed to get all file paths:'), error)
    channel.send({
      event: 'return-all-files',
      type: 'broadcast',
      payload: { message: 'Failed to get all file paths', error },
    })
  }
}

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  const files = fs.readdirSync(dirPath)

  files.forEach(file => {
    const filePath = path.join(dirPath, file)

    // Ignore node_modules and .git folders
    if (file === 'node_modules' || file === '.git') {
      return
    }

    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles)
    } else {
      arrayOfFiles.push(path.relative(__dirname, filePath))
    }
  })

  return arrayOfFiles
}
