// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.2'


Deno.serve(async (req) => {
  const supabase = createClient(
    'https://dyiynfghnhxawehqnred.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5aXluZmdobmh4YXdlaHFucmVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTYyNDYwNDgsImV4cCI6MjAzMTgyMjA0OH0.R9A2a4eLwXNKdQpHD0HfxciNZDfinik-cf7fLfp69xI',
    { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
  )

  const { code, path } = await req.json()

  const channel = await supabase.channel('aria').send({
    type: 'broadcast',
    event: 'push-code',
    payload: { code, path },
  })


  return new Response(
    JSON.stringify({ success: true }),
    { headers: { "Content-Type": "application/json" } },
  )
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/push-code' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
