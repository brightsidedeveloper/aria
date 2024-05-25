import { green, redBright } from 'colorette'
import { Payload, channel } from './deploy'
import fs from 'fs'
import path from 'path'

export const handleDeleteFile = async ({ path: filePath }: Payload) => {
  if (!filePath) {
    channel.send({
      event: 'delete-file',
      type: 'broadcast',
      payload: { message: 'Invalid payload: Missing path' },
    })
    return
  }

  const finalPath = path.join(__dirname, filePath)

  if (fs.existsSync(finalPath)) {
    fs.unlinkSync(finalPath)
    console.log(green(`File deleted successfully from ${filePath}`))
    channel.send({
      event: 'delete-file',
      type: 'broadcast',
      payload: {
        message: `File deleted successfully from ${filePath}`,
        path: filePath,
      },
    })
  } else {
    console.log(redBright('File does not exist:'), finalPath)
    channel.send({
      event: 'delete-file',
      type: 'broadcast',
      payload: { message: 'File does not exist', path: filePath },
    })
  }
}
