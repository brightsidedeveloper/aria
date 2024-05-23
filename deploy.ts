import fs from 'fs'
import simpleGit from 'simple-git'
import path from 'path'

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

import { magenta, cyan, redBright, green, blueBright } from 'colorette'

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
  path: string
  commitMsg?: string
}

const handleCreateFile = async ({ code, path: filePath }: Payload) => {
  if (!code || !filePath) {
    channel.send({ event: 'create-file', type: 'broadcast', payload: { message: 'Invalid payload: Missing code or path' } })
    return
  }

  const ensureFolderPath = filePath.split('/').slice(0, -1).join('/')
  handleCreateFolder({ path: ensureFolderPath })
  try {
    const finalPath = path.join(__dirname, filePath)
    fs.writeFileSync(finalPath, code, 'utf8')
    console.log(green(`File created successfully at ${filePath}`))
    channel.send({ event: 'create-file', type: 'broadcast', payload: { message: `File created successfully at ${filePath}`, path: filePath } })
  } catch (error: unknown) {
    console.log(redBright('Failed to create file:'), error)
    channel.send({ event: 'create-file', type: 'broadcast', payload: { message: `Failed to create file: You are not handling this error well. Look at line 42 of deploy`, path: filePath } })
  }
}

const handleDeleteFile = async ({ path: filePath }: Payload) => {
  if (!filePath) {
    channel.send({ event: 'delete-file', type: 'broadcast', payload: { message: 'Invalid payload: Missing path' } })
    return
  }

  const finalPath = path.join(__dirname, filePath)

  if (fs.existsSync(finalPath)) {
    fs.unlinkSync(finalPath)
    console.log(green(`File deleted successfully from ${filePath}`))
    channel.send({ event: 'delete-file', type: 'broadcast', payload: { message: `File deleted successfully from ${filePath}`, path: filePath } })
  } else {
    console.log(redBright('File does not exist:'), finalPath)
    channel.send({ event: 'delete-file', type: 'broadcast', payload: { message: 'File does not exist', path: filePath } })
  }
}

const handlePushFile = async ({ path: filePath, commitMsg = 'Add Changes' }: Payload) => {
  if (!filePath) {
    channel.send({ event: 'push-file', type: 'broadcast', payload: { message: 'Invalid payload: Missing path' } })
    return
  }

  const finalPath = path.join(__dirname, filePath)
  try {
    await git.add(finalPath)
    await git.commit(commitMsg)
    await git.push('origin', 'main') // Ensure 'main' is the correct branch
    console.log(green('File updated and pushed to GitHub successfully!'))
    channel.send({ event: 'push-file', type: 'broadcast', payload: { message: 'File updated and pushed to GitHub successfully!', path: filePath } })
  } catch (error) {
    console.log(redBright('Failed to push file update to GitHub:'), error)
    channel.send({
      event: 'push-file',
      type: 'broadcast',
      payload: { message: `Failed to push file update to GitHub: You are not handling this error well. Look at line 42 of deploy`, path: filePath },
    })
  }
}

const handleGetFile = async ({ path: filePath }: Payload) => {
  if (!filePath) {
    channel.send({ event: 'get-file', type: 'broadcast', payload: { message: 'Invalid payload: Missing path' } })
    return
  }

  const finalPath = path.join(__dirname, filePath)
  if (fs.existsSync(finalPath)) {
    const code = fs.readFileSync(finalPath, 'utf8')
    channel.send({ event: 'return-file', type: 'broadcast', payload: { code, path: filePath } })
    console.log(green(`File retrieved successfully from ${filePath}`))
  } else {
    console.log(redBright('File does not exist:'), finalPath)
    channel.send({ event: 'return-file', type: 'broadcast', payload: { message: 'File does not exist', path: filePath } })
  }
}

const handleCreateFolder = async ({ path: folderPath }: Payload) => {
  if (!folderPath) {
    channel.send({ event: 'create-folder', type: 'broadcast', payload: { message: 'Invalid payload: Missing path' } })
    return
  }

  const finalPath = path.join(__dirname, folderPath)
  if (!fs.existsSync(finalPath)) {
    fs.mkdirSync(finalPath, { recursive: true })
    console.log(green(`Folder created at: ${finalPath}`))
    channel.send({ event: 'create-folder', type: 'broadcast', payload: { message: `Folder created at: ${finalPath}`, path: folderPath } })
  } else {
    console.log(redBright('Folder already exists:'), finalPath)
    channel.send({ event: 'create-folder', type: 'broadcast', payload: { message: 'Folder already exists', path: folderPath } })
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

const handleGetAllFilePaths = async () => {
  const rootDir = path.resolve(__dirname) // Get the absolute path of the root directory
  const allFiles = getAllFiles(rootDir)
  channel.send({ event: 'return-all-files', type: 'broadcast', payload: { files: allFiles } })
  console.log(green('Retrieved all file paths successfully'))
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
    case 'get-file':
      return handleGetFile(payload)
    case 'get-all-files':
      return handleGetAllFilePaths()
    default:
      console.log(redBright('Invalid event:'), event)
      channel.send({ event: 'invalid-event', type: 'broadcast', payload: { message: 'Invalid event' } })
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
                 ╚═╝  ╚═╝╚═════╝ ╚═╝╚═╝  ╚═╝
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
