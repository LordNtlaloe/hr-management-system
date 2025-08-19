'use server'

import TokenEmail from "@/react-email-starter/emails/token-email";
import { render } from '@react-email/render';
import nodemailer from "nodemailer";

// Send email with token
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
    const { SMTP_EMAIL, SMTP_PASSWORD } = process.env

    if (!SMTP_EMAIL || !SMTP_PASSWORD) {
        console.error('SMTP credentials not found in environment variables');
        return { success: false, error: 'SMTP configuration missing' };
    }

    const transport = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: SMTP_EMAIL,
            pass: SMTP_PASSWORD
        }
    })

    // Test email connection
    try {
        const testResult = await transport.verify()
        console.log('SMTP connection verified:', testResult);
    } catch (error) {
        console.error('SMTP verification failed:', error);
        return { success: false, error: 'SMTP connection failed' };
    }

    // Render the React Email component to HTML
    const emailHtml = await render(TokenEmail({ name, token, tokenType }));

    // Send email
    try {
        const sendResult = await transport.sendMail({
            from: `"Your App Name" <${SMTP_EMAIL}>`,
            to: to,
            subject: subject,
            html: emailHtml
        })
        
        console.log('Email sent successfully:', sendResult.messageId);
        return { success: true, messageId: sendResult.messageId || 'sent' };
        
    } catch (error) {
        console.error('Failed to send email:', error);
        return { success: false, error: 'Failed to send email' };
    }
}

// Usage examples:

// Example 1: Email verification
export async function sendVerificationEmail(email: string, name: string, token: string) {    
    return await sendTokenEmail({
        to: email,
        name: name,
        subject: "Verify Your Email Address",
        token: token,
        tokenType: 'verification'
    });
}

// Example 2: Password reset
export async function sendPasswordResetEmail(email: string, name: string, token: string) {
    return await sendTokenEmail({
        to: email,
        name: name,
        subject: "Reset Your Password",
        token: token,
        tokenType: 'reset'
    });
}

// Example 3: User invitation
export async function sendInvitationEmail(email: string, name: string, token: string) {
    return await sendTokenEmail({
        to: email,
        name: name,
        subject: "You've Been Invited!",
        token: token,
        tokenType: 'invitation'
    });
}