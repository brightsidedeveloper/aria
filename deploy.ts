import { exec, spawn } from 'child_process'

import fs from 'fs'
import simpleGit from 'simple-git'
import path from 'path'

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

import { magenta, cyan, redBright, green, blueBright, yellow } from 'colorette'

// Load environment variables from .env file
dotenv.config()

const git = simpleGit()

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)

interface BroadcastPayload {
  event: string
  type: string
  payload: Payload
}

interface Payload {
  code?: string
  commitMsg?: string
  command?: string
  path?: string
  paths?: string[]
}

const handleCreateFile = async ({ code, path: filePath }: Payload) => {
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

const handleDeleteFile = async ({ path: filePath }: Payload) => {
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

const handlePushFile = async ({ path: filePath, commitMsg = 'Add Changes' }: Payload) => {
  if (!filePath) {
    channel.send({
      event: 'push-file',
      type: 'broadcast',
      payload: { message: 'Invalid payload: Missing path' },
    })
    return
  }

  const finalPath = path.join(__dirname, filePath)
  try {
    await git.add(finalPath)
    await git.commit(commitMsg)
    await git.push('origin', 'main') // Ensure 'main' is the correct branch
    console.log(green('File updated and pushed to GitHub successfully!'))
    channel.send({
      event: 'push-file',
      type: 'broadcast',
      payload: {
        message: 'File updated and pushed to GitHub successfully!',
        path: filePath,
      },
    })
  } catch (error) {
    console.log(redBright('Failed to push file update to GitHub:'), error)
    channel.send({
      event: 'push-file',
      type: 'broadcast',
      payload: {
        message: `Failed to push file update to GitHub: You are not handling this error well. Look at line 42 of deploy`,
        path: filePath,
      },
    })
  }
}

const handleGetFile = async ({ path: filePath }: Payload) => {
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

const handleGetFiles = async ({ paths }: Payload) => {
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

const handleGetDirectories = async () => {
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

let devProcess: ReturnType<typeof spawn> | null = null

const stopDevServer = (fromStart?: boolean) => {
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

const startDevServer = ({ path: filePath }: Payload) => {
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

const runCommand = ({ command, path: filePath }: Payload) => {
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

const handleBroadcast = async ({ payload, event }: BroadcastPayload) => {
  console.log(blueBright(JSON.stringify({ payload, event })))
  switch (event) {
    case 'create-file':
      return handleCreateFile(payload)
    case 'delete-file':
      return handleDeleteFile(payload)
    case 'push-file':
      return handlePushFile(payload)
    case 'read-file':
      return handleGetFile(payload)
    case 'read-files':
      return handleGetFiles(payload)
    case 'get-directories':
      return handleGetDirectories()
    case 'start-dev-server':
      return startDevServer(payload)
    case 'stop-dev-server':
      return stopDevServer()
    case 'run-command':
      return runCommand(payload)
    default:
      console.log(redBright('Invalid event:'), event)
      channel.send({
        event: 'invalid-event',
        type: 'broadcast',
        payload: { message: 'Invalid event' },
      })
  }
}

const channel = supabase.channel('aria')

channel.on('broadcast', { event: '*' }, handleBroadcast).subscribe()

const logAriaGPT = () => {
  console.log(
    magenta(`
                  █████╗ ██████╗ ██╗ █████╗
                 ██╔══██╗██╔══██╗██║██╔══██╗
                 ███████║██████╔╝██║███████║
                 ██╔══██║██╔══██╗██║██╔══██║
                 ██║  ██║██   ██╝██║██║  ██║
                 ╚═╝  ╚═╝╚╝   ╚╝ ╚═╝╚═╝  ╚═╝
  `)
  )
  console.log(
    cyan(`
    ******************************************************
    *                                                    *
    *      Aria-GPT: Your Ultimate AI Developer!         *
    *      Writing flawless code on your machine.        *
    *                                                    *
    ******************************************************

  `)
  )
}

logAriaGPT()

process.stdin.resume() // Keep process alive
