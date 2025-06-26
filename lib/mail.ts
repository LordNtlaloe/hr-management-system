'use server'

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

    // Create email HTML body with token
    const emailBody = createTokenEmailHTML(name, token, tokenType);

    // Send email
    try {
        const sendResult = await transport.sendMail({
            from: `"Your App Name" <${SMTP_EMAIL}>`,
            to: to,
            subject: subject,
            html: emailBody
        })
        
        console.log('Email sent successfully:', sendResult.messageId);
        return { success: true, messageId: sendResult.messageId };
        
    } catch (error) {
        console.error('Failed to send email:', error);
        return { success: false, error: 'Failed to send email' };
    }
}

// Create HTML email template with token
function createTokenEmailHTML(name: string, token: string, tokenType: string): string {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    
    let actionUrl = '';
    let actionText = '';
    let emailTitle = '';
    let emailMessage = '';

    switch (tokenType) {
        case 'verification':
            actionUrl = `${baseUrl}/auth/verify-email?token=${token}`;
            actionText = 'Verify Email';
            emailTitle = 'Verify Your Email Address';
            emailMessage = 'Please click the button below to verify your email address:';
            break;
        case 'reset':
            actionUrl = `${baseUrl}/auth/reset-password?token=${token}`;
            actionText = 'Reset Password';
            emailTitle = 'Reset Your Password';
            emailMessage = 'You requested a password reset. Click the button below to reset your password:';
            break;
        case 'invitation':
            actionUrl = `${baseUrl}/auth/accept-invitation?token=${token}`;
            actionText = 'Accept Invitation';
            emailTitle = 'You\'ve Been Invited';
            emailMessage = 'You\'ve been invited to join our platform. Click the button below to get started:';
            break;
        default:
            actionUrl = `${baseUrl}/auth/verify?token=${token}`;
            actionText = 'Verify';
            emailTitle = 'Action Required';
            emailMessage = 'Please click the button below to continue:';
    }

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${emailTitle}</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .email-container {
                background-color: #ffffff;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .header h1 {
                color: #2c3e50;
                margin: 0;
            }
            .content {
                margin-bottom: 30px;
            }
            .token-button {
                display: inline-block;
                background-color: #3498db;
                color: white;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 5px;
                font-weight: bold;
                text-align: center;
                margin: 20px 0;
            }
            .token-button:hover {
                background-color: #2980b9;
            }
            .token-code {
                background-color: #f8f9fa;
                border: 2px dashed #dee2e6;
                padding: 15px;
                font-family: 'Courier New', monospace;
                font-size: 18px;
                text-align: center;
                margin: 20px 0;
                border-radius: 5px;
                letter-spacing: 2px;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                font-size: 12px;
                color: #666;
            }
            .warning {
                background-color: #fff3cd;
                border: 1px solid #ffeaa7;
                padding: 15px;
                border-radius: 5px;
                margin: 20px 0;
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <h1>${emailTitle}</h1>
            </div>
            
            <div class="content">
                <p>Hello ${name},</p>
                <p>${emailMessage}</p>
                
                <div style="text-align: center;">
                    <a href="${actionUrl}" class="token-button">${actionText}</a>
                </div>
                
                <p>Or copy and paste this token if the button doesn't work:</p>
                <div class="token-code">${token}</div>
                
                <div class="warning">
                    <strong>Security Notice:</strong> This token will expire in 24 hours. If you didn't request this action, please ignore this email.
                </div>
            </div>
            
            <div class="footer">
                <p>This is an automated email. Please do not reply to this message.</p>
                <p>If you're having trouble with the button above, copy and paste the URL below into your web browser:</p>
                <p><a href="${actionUrl}">${actionUrl}</a></p>
            </div>
        </div>
    </body>
    </html>
    `;
}

// Usage examples:

// Example 1: Email verification
export async function sendVerificationEmail(email: string, name: string, token: string) {    
    // Save token to database here with expiration
    // await saveVerificationToken(email, token);
    
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
    
    // Save token to database here with expiration
    // await savePasswordResetToken(email, token);
    
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
    
    // Save token to database here with expiration
    // await saveInvitationToken(email, token);
    
    return await sendTokenEmail({
        to: email,
        name: name,
        subject: "You've Been Invited!",
        token: token,
        tokenType: 'invitation'
    });
}