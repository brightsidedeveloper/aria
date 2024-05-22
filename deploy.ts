import fs from 'fs'
import simpleGit from 'simple-git'
import path from 'path'

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

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
  code: string
  path: string
}

const handleBroadcast = async ({ payload: { code, path: filePath } }: BroadcastPayload) => {
  if (!code || !filePath) return console.log('Invalid payload')

  const finalPath = path.join(__dirname, filePath)
  fs.writeFileSync(finalPath, code, 'utf8')

  try {
    await git.add(finalPath)
    await git.commit('Add generated file')
    await git.push('origin', 'main') // Ensure 'main' is the correct branch
    console.log('File pushed to GitHub successfully!')
  } catch (error) {
    console.error('Failed to push file to GitHub:', error)
  }
}

const channel = supabase.channel('aria')

channel.on('broadcast', { event: 'push-code' }, handleBroadcast).subscribe()

process.stdin.resume() // Keep process alive
