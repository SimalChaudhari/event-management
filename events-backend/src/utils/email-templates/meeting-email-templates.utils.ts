export class MeetingEmailTemplates {
  // Meeting Request Email Templates
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
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1976d2;">New Meeting Request</h2>
          <p>Dear ${targetUser.firstName || targetUser.email},</p>
          <p>You have received a new meeting request:</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">${meeting.title}</h3>
            <p><strong>Date:</strong> ${meeting.meetingDate ? new Date(meeting.meetingDate).toLocaleDateString() : 'Not specified'}</p>
            <p><strong>Time:</strong> ${meeting.time || 'Not specified'}</p>
            <p><strong>Duration:</strong> ${meeting.duration ? this.formatDuration(meeting.duration) : 'Not specified'}</p>
            <p><strong>Location:</strong> ${meeting.location || 'Not specified'}</p>
            <p><strong>Details:</strong> ${meeting.details || 'No additional details'}</p>
          </div>
          
          <p><strong>Requested by:</strong> ${currentUser.firstName || currentUser.email}</p>
          <p><strong>Requested on:</strong> ${new Date().toLocaleDateString()}</p>
          
          <p>Please respond to this meeting request by accepting or rejecting it.</p>
          
          <p>Best regards,<br>Event Management Team</p>
        </div>
      </body>
      </html>
    `;
  }

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
        <title>Meeting Request Sent Successfully</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #388e3c;">Meeting Request Sent Successfully</h2>
          <p>Dear ${currentUser.firstName || currentUser.email},</p>
          <p>Your meeting request has been sent successfully:</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">${meeting.title}</h3>
            <p><strong>Date:</strong> ${meeting.meetingDate ? new Date(meeting.meetingDate).toLocaleDateString() : 'Not specified'}</p>
            <p><strong>Time:</strong> ${meeting.time || 'Not specified'}</p>
            <p><strong>Duration:</strong> ${meeting.duration ? this.formatDuration(meeting.duration) : 'Not specified'}</p>
            <p><strong>Location:</strong> ${meeting.location || 'Not specified'}</p>
            <p><strong>Details:</strong> ${meeting.details || 'No additional details'}</p>
          </div>
          
          <p><strong>Sent to:</strong> ${targetUser.firstName || targetUser.email}</p>
          <p><strong>Sent on:</strong> ${new Date().toLocaleDateString()}</p>
          
          <p>The recipient will be notified and can respond to your request.</p>
          
          <p>Best regards,<br>Event Management Team</p>
        </div>
      </body>
      </html>
    `;
  }

  // Meeting Response Email Templates
  static generateMeetingResponseEmailHTML(
    creator: any,
    currentUser: any,
    meeting: any,
    responseDto: any
  ): string {
    const isAccepted = responseDto.response === 'accepted';
    const statusColor = isAccepted ? '#388e3c' : '#d32f2f';
    const statusText = isAccepted ? 'Accepted' : 'Rejected';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Meeting Request ${statusText}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: ${statusColor};">Meeting Request ${statusText}</h2>
          <p>Dear ${creator.firstName || creator.email},</p>
          <p>Your meeting request has been ${responseDto.response}:</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">${meeting.title}</h3>
            <p><strong>Date:</strong> ${meeting.meetingDate ? new Date(meeting.meetingDate).toLocaleDateString() : 'Not specified'}</p>
            <p><strong>Time:</strong> ${meeting.time || 'Not specified'}</p>
            <p><strong>Duration:</strong> ${meeting.duration ? this.formatDuration(meeting.duration) : 'Not specified'}</p>
            <p><strong>Location:</strong> ${meeting.location || 'Not specified'}</p>
            <p><strong>Details:</strong> ${meeting.details || 'No additional details'}</p>
          </div>
          
          <p><strong>${statusText} by:</strong> ${currentUser.firstName || currentUser.email}</p>
          <p><strong>${statusText} on:</strong> ${new Date().toLocaleDateString()}</p>
          ${responseDto.message ? `<p><strong>Response message:</strong> ${responseDto.message}</p>` : ''}
          
          ${isAccepted ? '<p>Your meeting is now confirmed!</p>' : '<p>The meeting request has been removed from both schedules.</p>'}
          
          <p>Best regards,<br>Event Management Team</p>
        </div>
      </body>
      </html>
    `;
  }

  // Meeting Rejection Email Templates
  static generateMeetingRejectionEmailHTML(
    creator: any,
    rejector: any,
    originalMeetingData: any,
    rejectedMeeting: any,
    rejectionMessage?: string
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Meeting Request Rejected</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #d32f2f;">Meeting Request Rejected</h2>
          <p>Dear ${creator.firstName || creator.email},</p>
          <p>Your meeting request has been rejected by the recipient:</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">${originalMeetingData.title}</h3>
            <p><strong>Date:</strong> ${originalMeetingData.date ? new Date(originalMeetingData.date).toLocaleDateString() : 'Not specified'}</p>
            <p><strong>Time:</strong> ${originalMeetingData.time || 'Not specified'}</p>
            <p><strong>Location:</strong> ${originalMeetingData.location || 'Not specified'}</p>
            <p><strong>Details:</strong> ${originalMeetingData.details || 'No additional details'}</p>
          </div>
          
          <p><strong>Rejected by:</strong> ${rejector.firstName || rejector.email}</p>
          <p><strong>Rejected on:</strong> ${new Date().toLocaleDateString()}</p>
          ${rejectionMessage ? `<p><strong>Rejection reason:</strong> ${rejectionMessage}</p>` : ''}
          
          <p>The meeting request has been removed from both parties' schedules.</p>
          
          <p>Best regards,<br>Event Management Team</p>
        </div>
      </body>
      </html>
    `;
  }

  static generateMeetingRejectionConfirmationEmailHTML(
    rejector: any,
    creator: any,
    originalMeetingData: any,
    rejectedMeeting: any,
    rejectionMessage?: string
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Meeting Request Rejected Successfully</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #388e3c;">Meeting Request Rejected Successfully</h2>
          <p>Dear ${rejector.firstName || rejector.email},</p>
          <p>You have successfully rejected the following meeting request:</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">${originalMeetingData.title}</h3>
            <p><strong>Date:</strong> ${originalMeetingData.date ? new Date(originalMeetingData.date).toLocaleDateString() : 'Not specified'}</p>
            <p><strong>Time:</strong> ${originalMeetingData.time || 'Not specified'}</p>
            <p><strong>Location:</strong> ${originalMeetingData.location || 'Not specified'}</p>
            <p><strong>Details:</strong> ${originalMeetingData.details || 'No additional details'}</p>
          </div>
          
          <p><strong>Requested by:</strong> ${creator.firstName || creator.email}</p>
          <p><strong>Rejected on:</strong> ${new Date().toLocaleDateString()}</p>
          ${rejectionMessage ? `<p><strong>Your rejection reason:</strong> ${rejectionMessage}</p>` : ''}
          
          <p>The meeting request has been removed from both parties' schedules.</p>
          <p>The person who requested the meeting has been notified of your rejection.</p>
          
          <p>Best regards,<br>Event Management Team</p>
        </div>
      </body>
      </html>
    `;
  }

  // Meeting Cancellation Email Templates
  static generateCancellationEmailHTML(
    targetUser: any,
    currentUser: any,
    originalMeetingData: any,
    cancelledMeeting: any
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Meeting Request Cancelled</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #d32f2f;">Meeting Request Cancelled</h2>
          <p>Dear ${targetUser.firstName || targetUser.email},</p>
          <p>The following meeting request has been cancelled:</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">${originalMeetingData.title}</h3>
            <p><strong>Date:</strong> ${originalMeetingData.date ? new Date(originalMeetingData.date).toLocaleDateString() : 'Not specified'}</p>
            <p><strong>Time:</strong> ${originalMeetingData.time || 'Not specified'}</p>
            <p><strong>Location:</strong> ${originalMeetingData.location || 'Not specified'}</p>
            <p><strong>Details:</strong> ${originalMeetingData.details || 'No additional details'}</p>
          </div>
          
          <p><strong>Cancelled by:</strong> ${currentUser.firstName || currentUser.email}</p>
          <p><strong>Cancelled on:</strong> ${new Date().toLocaleDateString()}</p>
          
          <p>If you have any questions, please contact the person who cancelled the meeting.</p>
          
          <p>Best regards,<br>Event Management Team</p>
        </div>
      </body>
      </html>
    `;
  }

  static generateCancellationConfirmationEmailHTML(
    currentUser: any,
    targetUser: any,
    originalMeetingData: any,
    cancelledMeeting: any
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Meeting Request Cancelled Successfully</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #388e3c;">Meeting Request Cancelled Successfully</h2>
          <p>Dear ${currentUser.firstName || currentUser.email},</p>
          <p>You have successfully cancelled the following meeting request:</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">${originalMeetingData.title}</h3>
            <p><strong>Date:</strong> ${originalMeetingData.date ? new Date(originalMeetingData.date).toLocaleDateString() : 'Not specified'}</p>
            <p><strong>Time:</strong> ${originalMeetingData.time || 'Not specified'}</p>
            <p><strong>Location:</strong> ${originalMeetingData.location || 'Not specified'}</p>
            <p><strong>Details:</strong> ${originalMeetingData.details || 'No additional details'}</p>
          </div>
          
          <p><strong>Target User:</strong> ${targetUser.firstName || targetUser.email}</p>
          <p><strong>Cancelled on:</strong> ${new Date().toLocaleDateString()}</p>
          
          <p>The target user has been notified of the cancellation.</p>
          
          <p>Best regards,<br>Event Management Team</p>
        </div>
      </body>
      </html>
    `;
  }

  // Meeting Reschedule Email Templates
  static generateRescheduleEmailHTML(
    targetUser: any,
    currentUser: any,
    originalMeetingData: any,
    updatedMeeting: any,
    rescheduleDto: any
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Meeting Rescheduled</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #ff9800;">Meeting Rescheduled</h2>
          <p>Dear ${targetUser.firstName || targetUser.email},</p>
          <p>The following meeting has been rescheduled:</p>
          
          <div style="background-color: #fff3e0; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ff9800;">
            <h3 style="margin-top: 0;">${originalMeetingData.title}</h3>
            <p><strong>Original Date:</strong> ${originalMeetingData.date ? new Date(originalMeetingData.date).toLocaleDateString() : 'Not specified'}</p>
            <p><strong>Original Time:</strong> ${originalMeetingData.time || 'Not specified'}</p>
            <p><strong>Original Location:</strong> ${originalMeetingData.location || 'Not specified'}</p>
            <p><strong>Original Details:</strong> ${originalMeetingData.details || 'No additional details'}</p>
          </div>
          
          <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #388e3c;">
            <h3 style="margin-top: 0;">New Meeting Details</h3>
            <p><strong>New Date:</strong> ${updatedMeeting.meetingDate ? new Date(updatedMeeting.meetingDate).toLocaleDateString() : 'Not specified'}</p>
            <p><strong>New Time:</strong> ${updatedMeeting.time || 'Not specified'}</p>
            <p><strong>New Location:</strong> ${updatedMeeting.location || 'Not specified'}</p>
            <p><strong>New Details:</strong> ${updatedMeeting.details || 'No additional details'}</p>
          </div>
          
          <p><strong>Rescheduled by:</strong> ${currentUser.firstName || currentUser.email}</p>
          <p><strong>Rescheduled on:</strong> ${new Date().toLocaleDateString()}</p>
          ${rescheduleDto.reason ? `<p><strong>Reason for rescheduling:</strong> ${rescheduleDto.reason}</p>` : ''}
          
          <p>Please update your calendar with the new meeting details.</p>
          
          <p>Best regards,<br>Event Management Team</p>
        </div>
      </body>
      </html>
    `;
  }

  static generateRescheduleConfirmationEmailHTML(
    currentUser: any,
    targetUser: any,
    originalMeetingData: any,
    updatedMeeting: any,
    rescheduleDto: any
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Meeting Rescheduled Successfully</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #388e3c;">Meeting Rescheduled Successfully</h2>
          <p>Dear ${currentUser.firstName || currentUser.email},</p>
          <p>You have successfully rescheduled the following meeting:</p>
          
          <div style="background-color: #fff3e0; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ff9800;">
            <h3 style="margin-top: 0;">${originalMeetingData.title}</h3>
            <p><strong>Original Date:</strong> ${originalMeetingData.date ? new Date(originalMeetingData.date).toLocaleDateString() : 'Not specified'}</p>
            <p><strong>Original Time:</strong> ${originalMeetingData.time || 'Not specified'}</p>
            <p><strong>Original Location:</strong> ${originalMeetingData.location || 'Not specified'}</p>
            <p><strong>Original Details:</strong> ${originalMeetingData.details || 'No additional details'}</p>
          </div>
          
          <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #388e3c;">
            <h3 style="margin-top: 0;">New Meeting Details</h3>
            <p><strong>New Date:</strong> ${updatedMeeting.meetingDate ? new Date(updatedMeeting.meetingDate).toLocaleDateString() : 'Not specified'}</p>
            <p><strong>New Time:</strong> ${updatedMeeting.time || 'Not specified'}</p>
            <p><strong>New Location:</strong> ${updatedMeeting.location || 'Not specified'}</p>
            <p><strong>New Details:</strong> ${updatedMeeting.details || 'No additional details'}</p>
          </div>
          
          <p><strong>Target User:</strong> ${targetUser.firstName || targetUser.email}</p>
          <p><strong>Rescheduled on:</strong> ${new Date().toLocaleDateString()}</p>
          ${rescheduleDto.reason ? `<p><strong>Reason for rescheduling:</strong> ${rescheduleDto.reason}</p>` : ''}
          
          <p>The target user has been notified of the rescheduling.</p>
          
          <p>Best regards,<br>Event Management Team</p>
        </div>
      </body>
      </html>
    `;
  }

  // Helper method to format duration
  private static formatDuration(duration: number): string {
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    
    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes}m`;
    }
  }
}
