import React from 'react';

const EventInfoSection = ({ event, track, session }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    try {
      const date = new Date(dateString);
      const day = date.getDate();
      const month = date.toLocaleString('en-US', { month: 'short' });
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'Not set';
    try {
      const time = new Date(`2000-01-01T${timeString}`);
      return time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch {
      return timeString;
    }
  };

  return (
    <div className="mb-3">
      <style>
        {`
          .event-info-wrapper {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
          }
          .event-info-col {
            display: flex;
            flex-direction: column;
            gap: 8px;
            min-width: 140px;
          }
          .event-info-item {
            margin: 0;
            font-size: clamp(11px, 2vw, 16px);
            word-break: break-word;
            overflow-wrap: break-word;
            line-height: 1.4;
          }
          @media (max-width: 320px) {
            .event-info-wrapper {
              grid-template-columns: 1fr;
            }
            .event-info-col {
              min-width: 100% !important;
            }
          }
        `}
      </style>
      <div className="event-info-wrapper">
        <div className="event-info-col">
          <p className="event-info-item">
            <strong>Event Title:</strong> {event?.name || 'N/A'}
          </p>
          <p className="event-info-item">
            <strong>Track Title:</strong> {track?.title || 'N/A'}
          </p>
          <p className="event-info-item">
            <strong>Session Title:</strong> {session?.title || 'N/A'}
          </p>
        </div>
        <div className="event-info-col">
          <p className="event-info-item">
            <strong>Start Date:</strong> {formatDate(event?.startDate)}
          </p>
          <p className="event-info-item">
            <strong>End Date:</strong> {formatDate(event?.endDate)}
          </p>
          <p className="event-info-item">
            <strong>Time:</strong> {formatTime(session?.startTime)} - {formatTime(session?.endTime)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default EventInfoSection;

