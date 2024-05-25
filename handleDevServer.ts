import { spawn } from 'child_process'
import { Payload, channel } from './deploy'
import { green, redBright, yellow } from 'colorette'
import path from 'path'

let devProcess: ReturnType<typeof spawn> | null = null

export const stopDevServer = (fromStart?: boolean) => {
  if (devProcess) {
    devProcess.kill('SIGINT')
    if (!fromStart)
      channel.send({
        event: 'stop-dev-server',
        type: 'broadcast',
        payload: { message: 'Development server stopped' },
      })
  } else {
    console.log(yellow('No development server is running.'))
    if (!fromStart)
      channel.send({
        event: 'stop-dev-server',
        type: 'broadcast',
        payload: { message: 'No development server is running' },
      })
  }
}

export const startDevServer = ({ path: filePath }: Payload) => {
  if (!filePath) {
    channel.send({
      event: 'start-dev-server',
      type: 'broadcast',
      payload: { message: 'Invalid payload: Missing path' },
    })
    return
  }
  if (devProcess) stopDevServer(true)
  const projectDir = path.join(__dirname, filePath)
  try {
    devProcess = spawn(/^win/.test(process.platform) ? 'npm.cmd' : 'npm', ['run', 'dev'], {
      cwd: projectDir,
      stdio: 'inherit',
    })
      .on('spawn', () => {
        console.log(green('Development server started...'))
        channel.send({
          event: 'start-dev-server',
          type: 'broadcast',
          payload: { message: 'Development server started' },
        })
      })
      .on('exit', code => {
        if (code === 0 || code === null) {
          console.log(green('Development server stopped.'))
          channel.send({
            event: 'start-dev-server',
            type: 'broadcast',
            payload: { message: 'Development server stopped' },
          })
        } else {
          console.log(redBright('Development server stopped with error code:'), code)
          channel.send({
            event: 'start-dev-server',
            type: 'broadcast',
            payload: { message: 'Development server stopped with error code', code },
          })
        }
      })
      .on('error', error => {
        console.log(redBright('Error starting development server:'), error)
        channel.send({
          event: 'start-dev-server',
          type: 'broadcast',
          payload: { message: 'Error starting development server', error },
        })
      })
  } catch (error) {
    console.error(redBright('Error starting development server:'), error)
    channel.send({
      event: 'start-dev-server',
      type: 'broadcast',
      payload: { message: 'Error starting development server', error },
    })
  }
}
