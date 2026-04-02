// Notification Template Variations
export const notificationTemplates = [
    {
        id: 'notification-basic',
        name: 'General Notification',
        description: 'Simple notification template',
        icon: 'feather icon-mail',
        type: 'notification',
        subject: 'Notification: {{title}}',
        body: `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background-color: #ffffff;">
    <tr>
        <td style="padding: 20px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                    <td style="padding-bottom: 20px;">
                        <h2 style="color: #333333; font-size: 20px; margin: 0; font-weight: bold;">{{title}}</h2>
                    </td>
                </tr>
                <tr>
                    <td style="color: #555555; font-size: 16px; padding-bottom: 20px;">
                        {{message}}
                    </td>
                </tr>
                <tr>
                    <td style="border-top: 1px solid #dddddd; padding-top: 20px;">
                        <p style="color: #777777; font-size: 12px; margin: 0;">
                            Best regards,<br>
                            Event Platform Team
                        </p>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>`,
        preview: '#f8f9fa'
    }
];

