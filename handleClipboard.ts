import clipboardy from 'clipboardy'
import { green, redBright } from 'colorette'
import { Payload, channel } from './deploy'

export const handleClipboard = async ({ content }: Payload) => {
  if (content) handleSetClipboard({ content })
  else handleGetClipboard()
}

const handleGetClipboard = async () => {
  try {
    const clipboardContent = await clipboardy.read()
    channel.send({
      event: 'clipboard-read',
      type: 'broadcast',
      payload: { clipboardContent },
    })
    console.log(green('Clipboard content: '), clipboardContent)
  } catch (error) {
    channel.send({
      event: 'clipboard-not-read',
      type: 'broadcast',
      payload: { message: 'There was an error.', error },
    })
    console.error(redBright('Error reading from clipboard: '), error)
  }
}

const handleSetClipboard = async ({ content }: Payload) => {
  if (!content)
    channel.send({
      event: 'clipboard-not-set',
      type: 'broadcast',
      payload: { message: 'Invalid payload: Missing clipboard content' },
    })
  try {
    await clipboardy.write(content!)
    channel.send({
      event: 'clipboard-set',
      type: 'broadcast',
      payload: { message: 'Clipboard content set successfully' },
    })
    console.log(green('Clipboard content set successfully'))
  } catch (error) {
    channel.send({
      event: 'clipboard-not-set',
      type: 'broadcast',
      payload: { message: 'There was an error.', error },
    })
    console.error(redBright('Error setting clipboard content: '), error)
  }
}
