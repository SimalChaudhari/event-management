// utils/event-color.util.ts

import { EventType } from "event/event.entity";


export const getEventColor = (type: EventType | undefined): string => {
  switch (type) {
    case EventType.Physical:
      return '#007bff'; // Blue
    case EventType.Virtual:
      return '#28a745'; // Green
    case EventType.Hybrid:
      return '#ffc107'; // Yellow
    default:
      return '#6c757d'; // Gray for unknown or undefined
  }
};
