import { blueBright } from 'colorette'
import { Payload, channel } from './deploy'
import { exec } from 'child_process'
import path from 'path'

export const runCommand = ({ command, path: filePath }: Payload) => {
  if (!command || !filePath) {
    channel.send({
      event: 'run-command',
      type: 'broadcast',
      payload: { message: 'Invalid payload: Missing command or path' },
    })
    return
  }
  const projectDir = path.join(__dirname, filePath)
  console.log(blueBright(`Running command: ${command}`))
  exec(command, { cwd: projectDir }, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`)
      channel.send({
        event: 'run-command',
        type: 'broadcast',
        payload: { message: 'Error running exec', error },
      })
      return
    }
    if (stderr) {
      console.error(`Stderr: ${stderr}`)
      channel.send({
        event: 'run-command',
        type: 'broadcast',
        payload: { message: 'Error in stderr', stderr },
      })
      return
    }
    console.log(`Terminal Output: ${stdout}`)
    channel.send({
      event: 'run-command',
      type: 'broadcast',
      payload: { message: stdout },
    })
  })
}
