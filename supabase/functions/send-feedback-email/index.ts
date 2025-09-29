import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FeedbackEmailRequest {
  subject: string;
  message: string;
  feedbackType: string;
  rating?: number;
  userEmail?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { subject, message, feedbackType, rating, userEmail }: FeedbackEmailRequest = await req.json();

    console.log('Sending feedback email with subject:', subject);

    // Import NotificationAPI
    const { default: notificationapi } = await import('https://esm.sh/notificationapi-node-server-sdk@latest');

    // Initialize NotificationAPI
    notificationapi.init(
      Deno.env.get('NOTIFICATION_API_CLIENT_ID') || '',
      Deno.env.get('NOTIFICATION_API_SECRET') || ''
    );

    // Prepare email content
    const emailContent = `
      <h2>New Feedback Received</h2>
      <p><strong>Type:</strong> ${feedbackType}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      ${rating ? `<p><strong>Rating:</strong> ${rating}/5 stars</p>` : ''}
      ${userEmail ? `<p><strong>User Email:</strong> ${userEmail}</p>` : ''}
      <hr>
      <h3>Message:</h3>
      <p>${message.replace(/\n/g, '<br>')}</p>
    `;

    // Send email via NotificationAPI
    const result = await notificationapi.send({
      type: 'new_feedback',
      to: {
        id: 'support',
        email: 'support@dinefineai.com'
      },
      parameters: {
        subject: `New ${feedbackType} Feedback: ${subject}`,
        feedback_type: feedbackType,
        user_email: userEmail || 'Anonymous User',
        rating: rating ? `${rating}/5 stars` : 'No rating provided',
        message: message,
        timestamp: new Date().toLocaleString()
      }
    });

    console.log('NotificationAPI response:', result.data);

    return new Response(JSON.stringify({ success: true, data: result.data }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-feedback-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);