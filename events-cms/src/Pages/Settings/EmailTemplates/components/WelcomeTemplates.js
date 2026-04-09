// Welcome Template Variations
export const welcomeTemplates = [
    {
        id: 'welcome-credentials',
        name: 'Welcome with Credentials',
        description: 'User registration with login details',
        icon: 'feather icon-lock',
        type: 'welcome',
        subject: 'Welcome to Our Event Platform!',
        templateKey: 'credentials-table'
    },
    {
        id: 'welcome-otp',
        name: 'Welcome with OTP',
        description: 'Email verification template',
        icon: 'feather icon-shield',
        type: 'welcome',
        subject: 'Verify Your Email Address',
        templateKey: 'otp-table'
    },
    {
        id: 'welcome-simple',
        name: 'Simple Welcome',
        description: 'Basic welcome message',
        icon: 'feather icon-mail',
        type: 'welcome',
        subject: 'Welcome {{firstName}}!',
        body: `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background-color: #ffffff;">
    <tr>
        <td style="padding: 30px 20px; text-align: center; background-color: #667eea;">
            <h1 style="color: #ffffff; font-size: 28px; margin: 0;">Welcome {{firstName}}!</h1>
        </td>
    </tr>
    <tr>
        <td style="padding: 30px 20px;">
            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Dear {{firstName}} {{lastName}},
            </p>
            <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                We're thrilled to have you join our event platform! Your account has been successfully created.
            </p>
            <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 0;">
                Get started by exploring our upcoming events and discover amazing opportunities.
            </p>
        </td>
    </tr>
    <tr>
        <td style="padding: 20px; text-align: center;">
            <a href="#" style="background-color: #667eea; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Get Started</a>
        </td>
    </tr>
    <tr>
        <td style="padding: 20px; border-top: 1px solid #e0e0e0;">
            <p style="color: #777777; font-size: 12px; text-align: center; margin: 0;">
                Best regards,<br>Event Platform Team
            </p>
        </td>
    </tr>
</table>`,
        preview: '#667eea'
    },
    {
        id: 'welcome-professional',
        name: 'Professional Welcome',
        description: 'Corporate style welcome',
        icon: 'feather icon-briefcase',
        type: 'welcome',
        subject: 'Welcome to {{eventName}}',
        body: `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background-color: #f8f9fa;">
    <tr>
        <td style="padding: 40px 20px; background-color: #ffffff;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                    <td style="padding-bottom: 20px; border-bottom: 2px solid #667eea;">
                        <h2 style="color: #333333; font-size: 24px; margin: 0;">Welcome {{firstName}}!</h2>
                    </td>
                </tr>
                <tr>
                    <td style="padding-top: 20px;">
                        <p style="color: #555555; font-size: 15px; line-height: 1.8; margin: 0 0 15px 0;">
                            Thank you for joining {{eventName}}. We're excited to have you as part of our community.
                        </p>
                        <p style="color: #555555; font-size: 15px; line-height: 1.8; margin: 0;">
                            Your account is now active and ready to use. If you have any questions, our support team is here to help.
                        </p>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
    <tr>
        <td style="padding: 20px; background-color: #ffffff; text-align: center;">
            <a href="#" style="background-color: #667eea; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: 600; display: inline-block;">Access Dashboard</a>
        </td>
    </tr>
</table>`,
        preview: '#f8f9fa'
    },
    {
        id: 'welcome-minimal',
        name: 'Minimal Welcome',
        description: 'Clean and simple design',
        icon: 'feather icon-zap',
        type: 'welcome',
        subject: 'Welcome!',
        body: `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background-color: #ffffff;">
    <tr>
        <td style="padding: 40px 20px; text-align: center;">
            <h2 style="color: #333333; font-size: 26px; margin: 0 0 20px 0; font-weight: 300;">Welcome, {{firstName}}!</h2>
            <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Your account has been created successfully.
            </p>
            <div style="border-top: 1px solid #e0e0e0; padding-top: 20px;">
                <p style="color: #999999; font-size: 13px; margin: 0;">
                    Event Platform Team
                </p>
            </div>
        </td>
    </tr>
</table>`,
        preview: '#ffffff'
    }
];

