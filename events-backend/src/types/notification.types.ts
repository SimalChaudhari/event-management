/**
 * Notification type enums for type safety and consistency
 */

export enum EventNotificationType {
  EVENT_UPDATE = 'event_update',
  EVENT_REMINDER = 'event_reminder',
  EVENT_CANCELLED = 'event_cancelled',
  EVENT_MATERIALS = 'event_materials',
  EVENT_REGISTRATION = 'event_registration',
  MEETING_REQUEST = 'meeting_request',
  MEETING_RESPONSE = 'meeting_response',
  MEETING_RESCHEDULE = 'meeting_reschedule',
  MEETING_CANCELLATION = 'meeting_cancellation',
  MEETING_REMINDER = 'meeting_reminder',
}

export enum GeneralNotificationType {
  GENERAL = 'general',
  EVENT = 'event',
  NETWORKING = 'networking',
  PERMISSION = 'permission',
  CHAT = 'chat',
  GROUP_CHAT = 'group_chat',
  TYPING = 'typing',
  ADVERT = 'advert',
  SCHEDULED_PUSH = 'scheduled_push',
  BROADCAST = 'broadcast',
  ORDER = 'order',
  PAYMENT = 'payment',
  MAINTENANCE = 'maintenance',
  WELCOME = 'welcome',
  REMINDER = 'reminder',
}

export enum NotificationType {
  // Event notification types
  EVENT_UPDATE = 'event_update',
  EVENT_REMINDER = 'event_reminder',
  EVENT_CANCELLED = 'event_cancelled',
  EVENT_MATERIALS = 'event_materials',
  EVENT_REGISTRATION = 'event_registration',
  MEETING_REQUEST = 'meeting_request',
  MEETING_RESPONSE = 'meeting_response',
  MEETING_RESCHEDULE = 'meeting_reschedule',
  MEETING_CANCELLATION = 'meeting_cancellation',
  MEETING_REMINDER = 'meeting_reminder',
  
  // General notification types
  GENERAL = 'general',
  EVENT = 'event',
  NETWORKING = 'networking',
  PERMISSION = 'permission',
  CHAT = 'chat',
  GROUP_CHAT = 'group_chat',
  TYPING = 'typing',
  ADVERT = 'advert',
  SCHEDULED_PUSH = 'scheduled_push',
  BROADCAST = 'broadcast',
  ORDER = 'order',
  PAYMENT = 'payment',
  MAINTENANCE = 'maintenance',
  WELCOME = 'welcome',
  REMINDER = 'reminder',
}
