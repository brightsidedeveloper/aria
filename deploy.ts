import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

import { redBright, blueBright } from 'colorette'
import { handleCreateFile } from './handleCreateFile'
import { handleDeleteFile } from './handleDeleteFile'
import { handlePushing } from './handlePushing'
import { handleGetFile } from './handleGetFile'
import { handleGetFiles } from './handleGetFiles'
import { handleGetDirectories } from './handleGetDirectories'
import { startDevServer, stopDevServer } from './handleDevServer'
import { runCommand } from './handleRunCommand'
import { logAriaGPT } from './logAria'
import { handleClipboard } from './handleClipboard'

// Load environment variables from .env file
dotenv.config()

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)

interface BroadcastPayload {
  event: string
  type: string
  payload: Payload
}

export interface Payload {
  code?: string
  commitMsg?: string
  command?: string
  path?: string
  paths?: string[]
  content?: string
}

const handleBroadcast = async ({ payload, event }: BroadcastPayload) => {
  console.log(blueBright(JSON.stringify({ payload, event })))
  switch (event) {
    case 'clipboard':
      return handleClipboard(payload)
    case 'run-command':
      return runCommand(payload)
    case 'create-file':
      return handleCreateFile(payload)
    case 'delete-file':
      return handleDeleteFile(payload)
    case 'push-file':
      return handlePushing(payload)
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
    default:
      console.log(redBright('Invalid event:'), event)
      channel.send({
        event: 'invalid-event',
        type: 'broadcast',
        payload: { message: 'Invalid event' },
      })
  }
}

export const channel = supabase.channel('aria')

channel.on('broadcast', { event: '*' }, handleBroadcast).subscribe()

logAriaGPT()

process.stdin.resume() // Keep process alive
