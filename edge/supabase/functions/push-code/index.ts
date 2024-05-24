import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.2'

Deno.serve(async req => {
  const supabase = createClient(
    'https://dyiynfghnhxawehqnred.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5aXluZmdobmh4YXdlaHFucmVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTYyNDYwNDgsImV4cCI6MjAzMTgyMjA0OH0.R9A2a4eLwXNKdQpHD0HfxciNZDfinik-cf7fLfp69xI',
    {
      global: { headers: { Authorization: req.headers.get('Authorization')! } },
    }
  )

  const { code, path, commitMsg, command, action, paths } = await req.json()

  const channel = supabase.channel('aria')
  let responded = false

  channel.on('broadcast', { event: '*' }, (payload: any) => (responded = payload)).subscribe()

  const resolveResponse = async () => {
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
    case 'get-directories':
      await channel.send({
        event: 'get-directories',
        type: 'broadcast',
        payload: {},
      })
      const files = await resolveResponse()
      if (!files)
        return new Response(
          JSON.stringify({
            message: 'Timeout while waiting for all file paths.',
          }),
          { headers: { 'Content-Type': 'application/json' } }
        )
      return new Response(JSON.stringify({ files }), {
        headers: { 'Content-Type': 'application/json' },
      })
    case 'read-file':
      if (!path)
        return new Response(JSON.stringify({ message: 'Missing path!' }), {
          headers: { 'Content-Type': 'application/json' },
        })
      await channel.send({
        event: 'read-file',
        type: 'broadcast',
        payload: { path },
      })
      const fileCode = await resolveResponse()
      if (!fileCode)
        return new Response(
          JSON.stringify({
            message: 'Timeout while waiting for file retrieval.',
          }),
          { headers: { 'Content-Type': 'application/json' } }
        )
      return new Response(JSON.stringify({ code: fileCode }), {
        headers: { 'Content-Type': 'application/json' },
      })
    case 'read-files':
      if (!paths)
        return new Response(JSON.stringify({ message: 'Missing paths!' }), {
          headers: { 'Content-Type': 'application/json' },
        })
      await channel.send({
        event: 'read-files',
        type: 'broadcast',
        payload: { paths },
      })
      const filesCode = await resolveResponse()
      if (!filesCode)
        return new Response(
          JSON.stringify({
            message: 'Timeout while waiting for files retrieval.',
          }),
          { headers: { 'Content-Type': 'application/json' } }
        )
      break
    case 'create-file':
      if (!code || !path) return new Response(JSON.stringify({ message: 'Missing code or path!' }), { headers: { 'Content-Type': 'application/json' } })
      await channel.send({
        event: 'create-file',
        type: 'broadcast',
        payload: { code, path },
      })
      await resolveResponse()
      break
    case 'delete-file':
      if (!path)
        return new Response(JSON.stringify({ message: 'Missing path!' }), {
          headers: { 'Content-Type': 'application/json' },
        })
      await channel.send({
        event: 'delete-file',
        type: 'broadcast',
        payload: { path },
      })
      await resolveResponse()
      break
    case 'push-file':
      if (!path) return new Response(JSON.stringify({ message: 'Missing code, path, or commit message!' }), { headers: { 'Content-Type': 'application/json' } })
      await channel.send({
        event: 'push-file',
        type: 'broadcast',
        payload: { code, path, commitMsg },
      })
      await resolveResponse()
      break
    case 'start-dev-server':
      if (!path)
        return new Response(JSON.stringify({ message: 'Missing path!' }), {
          headers: { 'Content-Type': 'application/json' },
        })
      await channel.send({
        event: 'start-dev-server',
        type: 'broadcast',
        payload: { path },
      })
      await resolveResponse()
      break
    case 'stop-dev-server':
      await channel.send({
        event: 'stop-dev-server',
        type: 'broadcast',
        payload: {},
      })
      await resolveResponse()
      break
    case 'run-command':
      if (!path || !command) return new Response(JSON.stringify({ message: 'Missing code or path!' }), { headers: { 'Content-Type': 'application/json' } })
      await channel.send({
        event: 'run-command',
        type: 'broadcast',
        payload: { command, path },
      })
      await resolveResponse()
      break
    default:
      return new Response(JSON.stringify({ message: 'Invalid action specified!' }), { headers: { 'Content-Type': 'application/json' } })
  }

  return new Response(JSON.stringify(responded ? { ...(responded as {}), success: true } : { success: true }), { headers: { 'Content-Type': 'application/json' } })
})
