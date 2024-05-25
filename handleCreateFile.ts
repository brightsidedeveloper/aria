import { green, redBright } from 'colorette'
import fs from 'fs'
import path from 'path'
import { Payload, channel } from './deploy'

export const handleCreateFile = async ({ code, path: filePath }: Payload) => {
  if (!code || !filePath) {
    channel.send({
      event: 'create-file',
      type: 'broadcast',
      payload: { message: 'Invalid payload: Missing code or path' },
    })
    return
  }

  const ensureFolderPath = filePath.split('/').slice(0, -1).join('/')
  handleCreateFolder({ path: ensureFolderPath })
  try {
    const finalPath = path.join(__dirname, filePath)
    fs.writeFileSync(finalPath, code, 'utf8')
    console.log(green(`File created successfully at ${filePath}`))
    channel.send({
      event: 'create-file',
      type: 'broadcast',
      payload: {
        message: `File created successfully at ${filePath}`,
        path: filePath,
      },
    })
  } catch (error: unknown) {
    console.log(redBright('Failed to create file:'), error)
    channel.send({
      event: 'create-file',
      type: 'broadcast',
      payload: {
        message: `Failed to create file`,
        path: filePath,
        error,
      },
    })
  }
}

const handleCreateFolder = async ({ path: folderPath }: Payload) => {
  if (!folderPath) {
    channel.send({
      event: 'create-folder',
      type: 'broadcast',
      payload: { message: 'Invalid payload: Missing path in handleCreateFolder' },
    })
    return
  }

  const finalPath = path.join(__dirname, folderPath)
  if (!fs.existsSync(finalPath)) {
    fs.mkdirSync(finalPath, { recursive: true })
    console.log(green(`Folder created at: ${finalPath}`))
  }
}
