import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok',{headers:corsHeaders})
  try {
    const auth=req.headers.get('Authorization')
    if(!auth) return json({error:'authentication_required'},401)
    const idempotency=req.headers.get('x-idempotency-key')
    if(!idempotency) return json({error:'idempotency_key_required'},400)
    const {bookingId}=await req.json()
    const supabase=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_ANON_KEY')!,{global:{headers:{Authorization:auth}}})
    const {data:{user}}=await supabase.auth.getUser()
    if(!user) return json({error:'authentication_required'},401)
    const admin=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const {data:booking,error}=await admin.from('bookings').select('id,renter_id,total_amount,currency,status').eq('id',bookingId).eq('renter_id',user.id).single()
    if(error||!booking) return json({error:'booking_not_found'},404)
    if(!['accepted','awaiting_payment'].includes(booking.status)) return json({error:'invalid_booking_status'},409)
    const provider=Deno.env.get('PAYMENT_PROVIDER')
    if(!provider||provider==='demo') return json({error:'payment_provider_not_configured',mode:'demo'},503)
    // Add the selected provider's server-side hosted-checkout adapter here. Never accept amount from the browser.
    return json({error:'provider_adapter_required'},501)
  } catch { return json({error:'invalid_request'},400) }
})

function json(body:unknown,status=200){return new Response(JSON.stringify(body),{status,headers:{...corsHeaders,'Content-Type':'application/json'}})}
