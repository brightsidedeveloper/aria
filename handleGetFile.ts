import { Payload, channel } from './deploy'
import fs from 'fs'
import path from 'path'
import { green, redBright } from 'colorette'

export const handleGetFile = async ({ path: filePath }: Payload) => {
  if (!filePath) {
    channel.send({
      event: 'read-file',
      type: 'broadcast',
      payload: { message: 'Invalid payload: Missing path in handleGetFile' },
    })
    return
  }

  const finalPath = path.join(__dirname, filePath)
  if (fs.existsSync(finalPath)) {
    const code = fs.readFileSync(finalPath, 'utf8')
    channel.send({
      event: 'return-file',
      type: 'broadcast',
      payload: { code, path: filePath },
    })
    console.log(green(`File retrieved successfully from ${filePath}`))
  } else {
    console.log(redBright('File does not exist:'), finalPath)
    channel.send({
      event: 'return-file',
      type: 'broadcast',
      payload: { message: 'File does not exist', path: filePath },
    })
  }
}
