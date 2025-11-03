import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { Resend } from "https://esm.sh/resend@2.0.0"

const resend = new Resend(Deno.env.get("RESEND_API_KEY"))

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, verificationCode } = await req.json()

    const { data, error } = await resend.emails.send({
      // CHANGE THIS LINE: Use your domain email address
      from: "Orchestrated By HIStory <noreply@orchestratedbyhistory.com>",
      to: [email],
      subject: "Your Verification Code - Orchestrated By HIStory",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Verification</h2>
          <p>You requested a password reset for your Orchestrated By HIStory account.</p>
          <div style="background: #f4f4f4; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0; border: 2px dashed #ccc;">
            <h3 style="margin: 0; font-size: 28px; letter-spacing: 8px; color: #333; font-weight: bold;">${verificationCode}</h3>
          </div>
          <p><strong>This code will expire in 15 minutes.</strong></p>
          <p>If you didn't request this reset, please ignore this email.</p>
          <hr style="margin: 30px 0;">
          <small style="color: #666;">Orchestrated By HIStory Event Planner</small>
        </div>
      `,
    })

    if (error) {
      console.error('Resend error:', error)
      throw error
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Email sent successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})