// Event Reminder Template Variations
export const eventReminderTemplates = [
    {
        id: 'event-reminder-basic',
        name: 'Event Reminder',
        description: 'Upcoming event notification',
        icon: 'feather icon-bell',
        type: 'event-reminder',
        subject: 'Reminder: {{eventName}} is Coming Soon',
        body: `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background-color: #ffffff;">
    <tr>
        <td style="padding: 20px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                    <td style="text-align: center; padding-bottom: 20px;">
                        <h2 style="color: #333333; font-size: 24px; margin: 0; font-weight: bold;">📅 Event Reminder</h2>
                    </td>
                </tr>
                <tr>
                    <td style="color: #555555; font-size: 16px; padding-bottom: 10px;">
                        Hello {{userName}},
                    </td>
                </tr>
                <tr>
                    <td style="color: #555555; font-size: 16px; padding-bottom: 20px;">
                        This is a reminder that <strong>{{eventName}}</strong> is coming soon!
                    </td>
                </tr>
                <tr>
                    <td style="padding-bottom: 20px;">
                        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border: 1px solid #b3d9ff; border-radius: 8px;">
                            <tr>
                                <td style="padding: 20px; background-color: #e7f3ff;">
                                    <p style="margin: 0; color: #004085; font-size: 16px; font-weight: bold;">Event: {{eventName}}</p>
                                    <p style="margin: 10px 0 0 0; color: #004085; font-size: 14px;">Date: {{eventDate}}</p>
                                    <p style="margin: 10px 0 0 0; color: #004085; font-size: 14px;">Location: {{eventLocation}}</p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
                <tr>
                    <td style="text-align: center; padding-bottom: 30px;">
                        <a href="#" style="background-color: #007bff; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">View Event Details</a>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>`,
        preview: '#e7f3ff'
    }
];

