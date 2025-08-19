import {
    Body,
    Button,
    Container,
    Head,
    Html,
    Link,
    Preview,
    Section,
    Text,
} from '@react-email/components';

interface TokenEmailProps {
    name: string;
    token: string;
    tokenType: 'verification' | 'reset' | 'invitation';
}

const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

export const TokenEmail = ({ name, token, tokenType = 'verification' }: TokenEmailProps) => {
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

    return (
        <Html>
            <Head />
            <Preview>{emailTitle}</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Section style={header}>
                        <Text style={heading}>{emailTitle}</Text>
                    </Section>

                    <Section style={content}>
                        <Text style={text}>Hello {name},</Text>
                        <Text style={text}>{emailMessage}</Text>

                        <Button style={button} href={actionUrl}>
                            {actionText}
                        </Button>

                        <Text style={text}>Or copy and paste this token if the button doesn't work:</Text>
                        <Text style={tokenCode}>{token}</Text>

                        <Section style={warning}>
                            <Text style={warningText}>
                                <strong>Security Notice:</strong> This token will expire in 24 hours. If you didn't request this action, please ignore this email.
                            </Text>
                        </Section>
                    </Section>

                    <Section style={footer}>
                        <Text style={footerText}>
                            This is an automated email. Please do not reply to this message.
                        </Text>
                        <Text style={footerText}>
                            If you're having trouble with the button above, copy and paste the URL below into your web browser:
                        </Text>
                        <Link style={footerLink} href={actionUrl}>
                            {actionUrl}
                        </Link>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

TokenEmail.PreviewProps = {
    name: 'John Doe',
    token: 'ABC123-456DEF-789GHI',
    tokenType: 'verification',
} as TokenEmailProps;

export default TokenEmail;

// Styles
const main = {
    backgroundColor: '#f4f4f4',
    fontFamily: 'Arial, sans-serif',
    padding: '20px 0',
};

const container = {
    backgroundColor: '#ffffff',
    border: '1px solid #f0f0f0',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    margin: '0 auto',
    maxWidth: '600px',
    padding: '30px',
};

const header = {
    textAlign: 'center' as const,
    marginBottom: '30px',
};

const heading = {
    color: '#2c3e50',
    fontSize: '24px',
    fontWeight: 'bold',
    margin: '0',
};

const content = {
    marginBottom: '30px',
};

const text = {
    color: '#333',
    fontSize: '16px',
    lineHeight: '1.6',
    margin: '10px 0',
};

const button = {
    backgroundColor: '#3498db',
    borderRadius: '5px',
    color: '#ffffff',
    display: 'block',
    fontFamily: 'Arial, sans-serif',
    fontSize: '16px',
    fontWeight: 'bold',
    margin: '20px auto',
    padding: '12px 30px',
    textAlign: 'center' as const,
    textDecoration: 'none',
    width: 'fit-content',
};

const tokenCode = {
    backgroundColor: '#f8f9fa',
    border: '2px dashed #dee2e6',
    borderRadius: '5px',
    color: '#333',
    fontFamily: "'Courier New', monospace",
    fontSize: '18px',
    letterSpacing: '2px',
    lineHeight: '1.5',
    margin: '20px 0',
    padding: '15px',
    textAlign: 'center' as const,
};

const warning = {
    backgroundColor: '#fff3cd',
    border: '1px solid #ffeaa7',
    borderRadius: '5px',
    margin: '20px 0',
    padding: '15px',
};

const warningText = {
    ...text,
    color: '#856404',
    margin: '0',
};

const footer = {
    borderTop: '1px solid #eee',
    marginTop: '30px',
    paddingTop: '20px',
    textAlign: 'center' as const,
};

const footerText = {
    ...text,
    color: '#666',
    fontSize: '12px',
    margin: '5px 0',
};

const footerLink = {
    ...text,
    color: '#666',
    fontSize: '12px',
    textDecoration: 'underline',
    wordBreak: 'break-all' as const,
};