/**
 * Notification text utility for consistent messaging across the application
 * Centralizes all notification titles, descriptions, and messages
 */

export class NotificationTextUtil {
  // Meeting Request Notifications
  static getMeetingRequestTitle(): string {
    return '📅 New Meeting Request';
  }

  static getMeetingRequestDescription(meetingTitle: string, creatorName: string, meetingDate: Date, time: string, location?: string): string {
    const locationText = location ? ` in ${location}` : '';
    return `You have received a new meeting request: "${meetingTitle}" from ${creatorName}. Meeting scheduled for ${meetingDate.toLocaleDateString()} at ${time}${locationText}.`;
  }

  // Meeting Response Notifications
  static getMeetingAcceptedTitle(): string {
    return '✅ Meeting Request Accepted';
  }

  static getMeetingAcceptedDescription(meetingTitle: string, responderName: string, meetingDate: Date, time: string, location?: string, message?: string): string {
    const locationText = location ? ` in ${location}` : '';
    const messageText = message ? ` Note: ${message}` : '';
    return `Your meeting request "${meetingTitle}" has been accepted by ${responderName}. Meeting is confirmed for ${meetingDate.toLocaleDateString()} at ${time}${locationText}.${messageText}`;
  }

  static getMeetingRejectedTitle(): string {
    return '❌ Meeting Request Rejected';
  }

  static getMeetingRejectedDescription(meetingTitle: string, responderName: string, message?: string): string {
    const messageText = message ? ` Reason: ${message}` : '';
    return `Your meeting request "${meetingTitle}" has been rejected by ${responderName}.${messageText}`;
  }

  // Meeting Reschedule Notifications
  static getMeetingRescheduledTitle(): string {
    return '🔄 Meeting Rescheduled';
  }

  static getMeetingRescheduledDescription(meetingTitle: string, reschedulerName: string, newDate: Date, newTime: string, newLocation?: string, reason?: string): string {
    const locationText = newLocation ? ` in ${newLocation}` : '';
    const reasonText = reason ? ` Reason: ${reason}` : '';
    return `Meeting "${meetingTitle}" has been rescheduled by ${reschedulerName}. New time: ${newDate.toLocaleDateString()} at ${newTime}${locationText}.${reasonText}`;
  }

  // Meeting Cancellation Notifications
  static getMeetingCancelledTitle(): string {
    return '❌ Meeting Cancelled';
  }

  static getMeetingCancelledDescription(meetingTitle: string, cancellerName: string, originalDate: Date, originalTime: string, originalLocation?: string): string {
    const locationText = originalLocation ? ` in ${originalLocation}` : '';
    return `Meeting "${meetingTitle}" has been cancelled by ${cancellerName}. The meeting was scheduled for ${originalDate.toLocaleDateString()} at ${originalTime}${locationText}.`;
  }

  // Event Notifications
  static getEventUpdateTitle(): string {
    return '📝 Event Updated';
  }

  static getEventRegistrationTitle(): string {
    return '🎉 Registration Confirmed!';
  }

  static getEventRegistrationDescription(eventTitle: string): string {
    return `You're all set for "${eventTitle}"! We'll keep you updated with any changes.`;
  }

  static getEventCancelledTitle(): string {
    return '😔 Event Cancelled';
  }

  static getEventCancelledDescription(eventTitle: string): string {
    return `Unfortunately, "${eventTitle}" has been cancelled. We apologize for any inconvenience.`;
  }

  // General Notifications
  static getWelcomeTitle(): string {
    return '🎉 Welcome to Event Platform!';
  }

  static getWelcomeDescription(userName: string): string {
    return `Hey ${userName}! Welcome aboard! 🚀 Get ready to discover amazing events!`;
  }

  static getReminderTitle(): string {
    return '⏰ Event Reminder';
  }

  static getReminderDescription(eventTitle: string, reminderTime: string): string {
    return `Don't miss out! "${eventTitle}" starts at ${reminderTime}. See you there! 🎯`;
  }

  // Email Subjects
  static getMeetingRequestEmailSubject(meetingTitle: string): string {
    return `New Meeting Request: ${meetingTitle}`;
  }

  static getMeetingResponseEmailSubject(meetingTitle: string, isAccepted: boolean): string {
    const status = isAccepted ? 'Accepted' : 'Rejected';
    return `Meeting Request ${status}: ${meetingTitle}`;
  }

  static getMeetingRescheduleEmailSubject(meetingTitle: string): string {
    return `Meeting Rescheduled: ${meetingTitle}`;
  }

  static getMeetingCancellationEmailSubject(meetingTitle: string): string {
    return `Meeting Request Cancelled: ${meetingTitle}`;
  }

  // Socket.IO Messages
  static getSocketMeetingRequestMessage(meetingTitle: string): string {
    return `You have received a new meeting request: "${meetingTitle}"`;
  }

  static getSocketMeetingResponseMessage(meetingTitle: string, isAccepted: boolean): string {
    const status = isAccepted ? 'accepted' : 'rejected';
    return `Your meeting request "${meetingTitle}" has been ${status}`;
  }

  static getSocketMeetingRescheduleMessage(meetingTitle: string): string {
    return `Meeting "${meetingTitle}" has been rescheduled`;
  }

  static getSocketMeetingCancellationMessage(meetingTitle: string): string {
    return `Meeting "${meetingTitle}" has been cancelled`;
  }

  static getSocketMeetingReminderMessage(meetingTitle: string): string {
    return `You have a meeting "${meetingTitle}" starting soon`;
  }

  // Console Log Messages
  static getConsoleMeetingCreatedMessage(meetingId: string, creatorId: string, targetId: string): string {
    return `Meeting request created successfully: ${meetingId} by ${creatorId} for ${targetId}`;
  }

  static getConsoleMeetingAcceptedMessage(meetingId: string, userId: string): string {
    return `Meeting request accepted: ${meetingId} by ${userId}`;
  }

  static getConsoleMeetingRejectedMessage(meetingId: string, userId: string): string {
    return `Meeting request rejected and removed: ${meetingId} by ${userId}`;
  }

  static getConsoleMeetingRescheduledMessage(meetingId: string, userId: string): string {
    return `Meeting rescheduled successfully: ${meetingId} by ${userId}`;
  }

  static getConsoleMeetingCancelledMessage(meetingId: string, userId: string): string {
    return `Meeting request cancelled successfully: ${meetingId} by ${userId}`;
  }

  // Response Messages
  static getMeetingAcceptedResponseMessage(): string {
    return 'Meeting request accepted successfully';
  }

  static getMeetingRejectedResponseMessage(): string {
    return 'Meeting request rejected and removed';
  }

  static getMeetingRejectedSuccessMessage(): string {
    return 'Meeting request rejected and removed successfully';
  }

  static getMeetingDeletedMessage(): string {
    return 'Meeting deleted successfully';
  }

  static getBulkMeetingDeletedMessage(count: number): string {
    return `Successfully deleted ${count} meeting(s)`;
  }

  static getNoMeetingsFoundMessage(): string {
    return 'No meetings found to delete';
  }

  // Error Messages
  static getTimeConflictMessage(meetingDate: string, conflictingTitle: string, conflictingTime: string, conflictingDuration: string): string {
    return `Time conflict detected on ${meetingDate}. This time slot overlaps with "${conflictingTitle}" (${conflictingTime} - ${conflictingDuration})`;
  }

  // Validation Messages
  static getInvalidResponseStatusMessage(): string {
    return 'Invalid response status. Must be either "accepted" or "rejected".';
  }

  static getCannotRescheduleInactiveMeetingMessage(): string {
    return 'Cannot reschedule an inactive meeting.';
  }

  static getCannotRescheduleStartedMeetingMessage(): string {
    return 'Cannot reschedule a meeting that has already started or completed.';
  }

  static getNewTimeTooCloseMessage(): string {
    return 'New meeting time must be at least 1 hour from now.';
  }

  static getSameDateTimeMessage(): string {
    return 'New date and time must be different from current meeting date and time.';
  }

  static getMissingOriginalDateMessage(): string {
    return 'Original meeting date is missing. Cannot reschedule.';
  }

  static getCannotCancelConfirmedMeetingMessage(): string {
    return 'Cannot cancel a confirmed meeting. Use reschedule instead.';
  }

  static getAlreadyCancelledMessage(): string {
    return 'This meeting request is already cancelled.';
  }

  // Warning Messages
  static getLocationNotProvidedWarning(): string {
    return 'Meeting location not provided. Consider adding a location for better organization.';
  }

  static getDetailsNotProvidedWarning(): string {
    return 'Meeting details not provided. Consider adding details for better context.';
  }

  static getNotesNotProvidedWarning(): string {
    return 'Meeting notes not provided. Consider adding notes for better organization.';
  }
}
