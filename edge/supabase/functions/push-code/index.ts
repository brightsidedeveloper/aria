// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.2'

Deno.serve(async req => {
  const supabase = createClient(
    'https://dyiynfghnhxawehqnred.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5aXluZmdobmh4YXdlaHFucmVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTYyNDYwNDgsImV4cCI6MjAzMTgyMjA0OH0.R9A2a4eLwXNKdQpHD0HfxciNZDfinik-cf7fLfp69xI',
    { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
  )

  const { code, path, commitMsg, action } = await req.json()

  const channel = supabase.channel('aria')
  let responded = false

  channel.on('broadcast', { event: '*' }, (payload: any) => (responded = payload)).subscribe()

  const waitForResponse = async () => {
    return await new Promise(resolve => {
      let tries = 0
      const interval = setInterval(() => {
        if (responded || tries >= 80) {
          clearInterval(interval)
          resolve(responded)
        }
        tries++
      }, 200)
    })
  }

  switch (action) {
    case 'create-file':
      if (!code || !path) return new Response(JSON.stringify({ message: 'Missing code or path!' }), { headers: { 'Content-Type': 'application/json' } })
      await channel.send({ event: 'create-file', type: 'broadcast', payload: { code, path } })
      break
    case 'delete-file':
      if (!path) return new Response(JSON.stringify({ message: 'Missing path!' }), { headers: { 'Content-Type': 'application/json' } })
      await channel.send({ event: 'delete-file', type: 'broadcast', payload: { path } })
      break
    case 'push-file':
      if (!path) return new Response(JSON.stringify({ message: 'Missing code, path, or commit message!' }), { headers: { 'Content-Type': 'application/json' } })
      await channel.send({ event: 'push-file', type: 'broadcast', payload: { code, path, commitMsg } })
      break
    case 'get-file':
      if (!path) return new Response(JSON.stringify({ message: 'Missing path!' }), { headers: { 'Content-Type': 'application/json' } })
      await channel.send({ event: 'get-file', type: 'broadcast', payload: { path } })
      const fileCode = await waitForResponse()
      if (!fileCode) return new Response(JSON.stringify({ message: 'Tell the user that we timed out.' }), { headers: { 'Content-Type': 'application/json' } })
      break
    case 'get-all-files':
      await channel.send({ event: 'get-all-files', type: 'broadcast', payload: {} })
      const files = await waitForResponse()
      if (!files) return new Response(JSON.stringify({ message: 'Tell the user that we timed out.' }), { headers: { 'Content-Type': 'application/json' } })
      break
    default:
      return new Response(JSON.stringify({ message: 'Action does not exist!' }), { headers: { 'Content-Type': 'application/json' } })
  }

  return new Response(JSON.stringify(responded ? { ...(responded as {}), success: true } : { success: true }), { headers: { 'Content-Type': 'application/json' } })
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/push-code' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
