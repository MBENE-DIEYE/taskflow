import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  // Gestisce la richiesta preflight CORS
  // Il browser manda prima questa richiesta per verificare i permessi
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  const { titolo, assegnatarioEmail, assegnatarioNome, progetto } = await req.json()

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${Deno.env.get("RESEND_API_KEY")}`
    },
    body: JSON.stringify({
      from: "TaskFlow <onboarding@resend.dev>",
      to: assegnatarioEmail,
      subject: `📋 Nuovo task assegnato: ${titolo}`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">Ciao ${assegnatarioNome}!</h2>
          <p>Ti è stato assegnato un nuovo task nel progetto <strong>${progetto}</strong>.</p>
          <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <h3 style="margin: 0; color: #1f2937;">📋 ${titolo}</h3>
          </div>
          <p style="color: #6b7280;">Accedi a TaskFlow per vedere tutti i dettagli.</p>
        </div>
      `
    })
  })

  const data = await res.json()

  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  })
})