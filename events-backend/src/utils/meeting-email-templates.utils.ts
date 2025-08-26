export class MeetingEmailTemplates {
  // Helper method to format date
  private static formatDate(date: Date | undefined): string {
    if (!date) return 'TBD';
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Generate reschedule email HTML
  static generateRescheduleEmailHTML(
    targetUser: any,
    currentUser: any,
    originalMeeting: any,
    rescheduledMeeting: any,
    rescheduleDto: any
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Meeting Rescheduled</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .details { background: #fff; padding: 20px; border: 1px solid #dee2e6; border-radius: 8px; }
          .time-change { background: #fff3cd; padding: 15px; border: 1px solid #ffeaa7; border-radius: 8px; margin: 15px 0; }
          .footer { margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>📅 Meeting Rescheduled</h2>
            <p>Hello ${targetUser?.firstName || 'there'},</p>
          </div>
          
          <div class="details">
            <h3>Meeting Details</h3>
            <p><strong>Title:</strong> ${originalMeeting.title}</p>
            <p><strong>Rescheduled by:</strong> ${currentUser?.firstName} ${currentUser?.lastName}</p>
            
            <div class="time-change">
              <h4>⏰ Time Change</h4>
              <p><strong>Original:</strong> ${originalMeeting.time} on ${this.formatDate(originalMeeting.meetingDate)}</p>
              <p><strong>New:</strong> ${rescheduleDto.newTime} on ${this.formatDate(new Date(rescheduleDto.newDate))}</p>
              ${rescheduleDto.reason ? `<p><strong>Reason:</strong> ${rescheduleDto.reason}</p>` : ''}
            </div>
            
            ${originalMeeting.location ? `<p><strong>Location:</strong> ${originalMeeting.location}</p>` : ''}
            ${originalMeeting.details ? `<p><strong>Details:</strong> ${originalMeeting.details}</p>` : ''}
          </div>
          
          <div class="footer">
            <p>This is an automated notification from your event management system.</p>
            <p>Please update your calendar accordingly.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Generate reschedule confirmation email HTML
  static generateRescheduleConfirmationEmailHTML(
    currentUser: any,
    targetUser: any,
    originalMeeting: any,
    rescheduledMeeting: any,
    rescheduleDto: any
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Meeting Rescheduled Successfully</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #d4edda; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .details { background: #fff; padding: 20px; border: 1px solid #dee2e6; border-radius: 8px; }
          .success { background: #d1ecf1; padding: 15px; border: 1px solid #bee5eb; border-radius: 8px; margin: 15px 0; }
          .footer { margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>✅ Meeting Rescheduled Successfully</h2>
            <p>Hello ${currentUser?.firstName || 'there'},</p>
          </div>
          
          <div class="details">
            <h3>Reschedule Confirmation</h3>
            <p>Your meeting has been successfully rescheduled.</p>
            
            <div class="success">
              <h4>📅 Updated Meeting Details</h4>
              <p><strong>Title:</strong> ${originalMeeting.title}</p>
              <p><strong>New Time:</strong> ${rescheduleDto.newTime} on ${this.formatDate(new Date(rescheduleDto.newDate))}</p>
              <p><strong>Duration:</strong> ${originalMeeting.duration} minutes</p>
              ${rescheduleDto.reason ? `<p><strong>Reason:</strong> ${rescheduleDto.reason}</p>` : ''}
            </div>
            
            <p><strong>Participant:</strong> ${targetUser?.firstName} ${targetUser?.lastName} will be notified of this change.</p>
          </div>
          
          <div class="footer">
            <p>This is a confirmation email from your event management system.</p>
            <p>Your calendar has been updated with the new meeting time.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Generate meeting response email HTML
  static generateMeetingResponseEmailHTML(
    creator: any,
    responder: any,
    meeting: any,
    responseDto: any
  ): string {
    const isAccepted = responseDto.response === 'accepted';
    const statusColor = isAccepted ? '#d4edda' : '#f8d7da';
    const statusBorder = isAccepted ? '#c3e6cb' : '#f5c6cb';
    const statusIcon = isAccepted ? '✅' : '❌';
    const statusText = isAccepted ? 'Accepted' : 'Rejected';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Meeting Request ${statusText}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${statusColor}; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .details { background: #fff; padding: 20px; border: 1px solid #dee2e6; border-radius: 8px; }
          .status { background: ${statusColor}; padding: 15px; border: 1px solid ${statusBorder}; border-radius: 8px; margin: 15px 0; }
          .footer { margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>${statusIcon} Meeting Request ${statusText}</h2>
            <p>Hello ${creator?.firstName || 'there'},</p>
          </div>
          
          <div class="details">
            <h3>Meeting Details</h3>
            <p><strong>Title:</strong> ${meeting.title}</p>
            <p><strong>Time:</strong> ${meeting.time} on ${this.formatDate(meeting.meetingDate)}</p>
            <p><strong>Duration:</strong> ${meeting.duration} minutes</p>
            <p><strong>Responded by:</strong> ${responder?.firstName} ${responder?.lastName}</p>
            
            <div class="status">
              <h4>📋 Response Status</h4>
              <p><strong>Status:</strong> ${statusText.toUpperCase()}</p>
              ${responseDto.message ? `<p><strong>Message:</strong> ${responseDto.message}</p>` : ''}
            </div>
            
            ${meeting.location ? `<p><strong>Location:</strong> ${meeting.location}</p>` : ''}
            ${meeting.details ? `<p><strong>Details:</strong> ${meeting.details}</p>` : ''}
          </div>
          
          <div class="footer">
            <p>This is an automated notification from your event management system.</p>
            ${isAccepted ? '<p>Your meeting has been confirmed. Please update your calendar.</p>' : '<p>The meeting request has been declined.</p>'}
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Generate meeting request email HTML
  static generateMeetingRequestEmailHTML(
    targetUser: any,
    currentUser: any,
    meeting: any
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Meeting Request</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #e3f2fd; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .details { background: #fff; padding: 20px; border: 1px solid #dee2e6; border-radius: 8px; }
          .action { background: #fff3cd; padding: 15px; border: 1px solid #ffeaa7; border-radius: 8px; margin: 15px 0; }
          .footer { margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>📅 New Meeting Request</h2>
            <p>Hello ${targetUser?.firstName || 'there'},</p>
          </div>
          
          <div class="details">
            <h3>Meeting Details</h3>
            <p><strong>Title:</strong> ${meeting.title}</p>
            <p><strong>From:</strong> ${currentUser?.firstName} ${currentUser?.lastName}</p>
            <p><strong>Time:</strong> ${meeting.time} on ${this.formatDate(meeting.meetingDate)}</p>
            <p><strong>Duration:</strong> ${meeting.duration} minutes</p>
            ${meeting.location ? `<p><strong>Location:</strong> ${meeting.location}</p>` : ''}
            ${meeting.details ? `<p><strong>Details:</strong> ${meeting.details}</p>` : ''}
            
            <div class="action">
              <h4>🔔 Action Required</h4>
              <p>You have received a meeting request. Please respond by accepting or rejecting it.</p>
              <p>You can also add a message when responding.</p>
            </div>
          </div>
          
          <div class="footer">
            <p>This is an automated notification from your event management system.</p>
            <p>Please respond to this meeting request as soon as possible.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Generate meeting request confirmation email HTML
  static generateMeetingRequestConfirmationEmailHTML(
    currentUser: any,
    targetUser: any,
    meeting: any
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Meeting Request Sent</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #d4edda; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .details { background: #fff; padding: 20px; border: 1px solid #dee2e6; border-radius: 8px; }
          .success { background: #d1ecf1; padding: 15px; border: 1px solid #bee5eb; border-radius: 8px; margin: 15px 0; }
          .footer { margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>✅ Meeting Request Sent Successfully</h2>
            <p>Hello ${currentUser?.firstName || 'there'},</p>
          </div>
          
          <div class="details">
            <h3>Request Confirmation</h3>
            <p>Your meeting request has been sent successfully.</p>
            
            <div class="success">
              <h4>📋 Meeting Details</h4>
              <p><strong>Title:</strong> ${meeting.title}</p>
              <p><strong>To:</strong> ${targetUser?.firstName} ${targetUser?.lastName}</p>
              <p><strong>Time:</strong> ${meeting.time} on ${this.formatDate(meeting.meetingDate)}</p>
              <p><strong>Duration:</strong> ${meeting.duration} minutes</p>
              ${meeting.location ? `<p><strong>Location:</strong> ${meeting.location}</p>` : ''}
            </div>
            
            <p><strong>Status:</strong> Waiting for response from ${targetUser?.firstName} ${targetUser?.lastName}</p>
            <p>You will be notified once they respond to your request.</p>
          </div>
          
          <div class="footer">
            <p>This is a confirmation email from your event management system.</p>
            <p>Your meeting request is pending approval.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
