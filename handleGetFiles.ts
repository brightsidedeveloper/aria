import { green, redBright } from 'colorette'
import { Payload, channel } from './deploy'
import fs from 'fs'
import path from 'path'

export const handleGetFiles = async ({ paths }: Payload) => {
  if (!Array.isArray(paths) || paths.length === 0) {
    console.log(redBright('Invalid payload: Missing paths in handleGetFiles'))
    channel.send({
      event: 'read-files',
      type: 'broadcast',
      payload: { message: 'Invalid payload: Missing paths in handleGetFiles' },
    })
    return
  }

  const filePromises = paths.map(async filePath => {
    const finalPath = path.join(__dirname, filePath)
    try {
      await fs.promises.access(finalPath)
      const code = await fs.promises.readFile(finalPath, 'utf8')
      return { code, path: filePath }
    } catch (error) {
      console.log(redBright('File does not exist or error accessing file:'), finalPath, error)
      return { message: 'File does not exist or error accessing file', path: filePath }
    }
  })

  const files = await Promise.all(filePromises)

  channel.send({
    event: 'return-files',
    type: 'broadcast',
    payload: { files },
  })
  console.log(green('Files retrieved successfully'))
}
