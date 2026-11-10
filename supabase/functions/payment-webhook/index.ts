import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async req => {
  const provider=Deno.env.get('PAYMENT_PROVIDER')
  const secret=Deno.env.get('PAYMENT_WEBHOOK_SECRET')
  if(!provider||provider==='demo'||!secret) return new Response('not configured',{status:503})
  const signature=req.headers.get('x-provider-signature')
  const raw=await req.text()
  // Provider-specific constant-time signature verification must be implemented before enabling production mode.
  if(!signature) return new Response('missing signature',{status:401})
  void raw
  void createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  return new Response('provider adapter required',{status:501})
})
