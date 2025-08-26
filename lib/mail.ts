'use server'
import TokenEmail from "@/react-email-starter/emails/token-email";
import { render } from '@react-email/render';
import { Resend } from 'resend';

// Send email with token using Resend
export async function sendTokenEmail({
    to,
    name,
    subject,
    token,
    tokenType = 'verification'
}: {
    to: string,
    name: string,
    subject: string,
    token: string,
    tokenType?: 'verification' | 'reset' | 'invitation'
}) {
    console.log('🚀 Starting sendTokenEmail function');
    console.log('📧 Email details:', { to, name, subject, tokenType, tokenLength: token?.length });

    // Enhanced environment variable checking
    const { RESEND_API_KEY, FROM_EMAIL } = process.env;

    console.log('🔧 Environment variables check:');
    console.log('- RESEND_API_KEY:', RESEND_API_KEY ? '✅ Set' : '❌ Missing');
    console.log('- FROM_EMAIL:', FROM_EMAIL ? '✅ Set' : '❌ Missing');

    if (!RESEND_API_KEY) {
        console.error('❌ Resend API key missing in environment variables');
        return { success: false, error: 'Resend API key missing' };
    }

    // Validate input parameters
    if (!to || !name || !subject || !token) {
        console.error('❌ Missing required parameters:', { to: !!to, name: !!name, subject: !!subject, token: !!token });
        return { success: false, error: 'Missing required email parameters' };
    }

    console.log('🔗 Initializing Resend...');
    const resend = new Resend(RESEND_API_KEY);

    // Render the React Email component to HTML
    console.log('🎨 Rendering email template...');
    let emailHtml;
    try {
        emailHtml = await render(TokenEmail({ name, token, tokenType }));
        console.log('✅ Email template rendered successfully');
        console.log('📝 Email HTML preview (first 200 chars):', emailHtml.substring(0, 200) + '...');
    } catch (error: any) {
        console.error('❌ Failed to render email template:', error);
        return { success: false, error: `Email template rendering failed: ${error.message}` };
    }

    // Send email
    console.log('📮 Sending email...');
    try {
        const fromEmail = FROM_EMAIL || 'HR Manangement <onboarding@resend.dev>';

        const mailOptions = {
            from: fromEmail,
            to: [to], // Resend expects an array
            subject: subject,
            html: emailHtml,
            text: `Hello ${name}, your ${tokenType} token is: ${token}` // Fallback text
        };

        console.log('📬 Mail options:', {
            from: mailOptions.from,
            to: mailOptions.to,
            subject: mailOptions.subject,
            htmlLength: mailOptions.html.length
        });

        const { data, error } = await resend.emails.send(mailOptions);

        if (error) {
            console.error('❌ Resend API error:', error);
            return { success: false, error: `Failed to send email: ${error.message || 'Unknown error'}` };
        }

        console.log('✅ Email sent successfully!');
        console.log('📧 Send result:', data);

        return {
            success: true,
            messageId: data?.id || 'sent',
            details: {
                accepted: [to],
                rejected: []
            }
        };

    } catch (error: any) {
        console.error('❌ Failed to send email:', error);
        console.error('Error details:', {
            name: error.name,
            message: error.message,
            code: error.code,
            stack: error.stack?.substring(0, 500)
        });
        return { success: false, error: `Failed to send email: ${error.message}` };
    }
}

// Enhanced verification email function
export async function sendVerificationEmail(email: string, name: string, token: string) {
    console.log('🔐 Sending verification email to:', email);
    return await sendTokenEmail({
        to: email,
        name: name,
        subject: "Verify Your Email Address",
        token: token,
        tokenType: 'verification'
    });
}

export async function sendPasswordResetEmail(email: string, name: string, token: string) {
    console.log('🔑 Sending password reset email to:', email);
    return await sendTokenEmail({
        to: email,
        name: name,
        subject: "Reset Your Password",
        token: token,
        tokenType: 'reset'
    });
}

export async function sendInvitationEmail(email: string, name: string, token: string) {
    console.log('🎉 Sending invitation email to:', email);
    return await sendTokenEmail({
        to: email,
        name: name,
        subject: "You've Been Invited!",
        token: token,
        tokenType: 'invitation'
    });
}