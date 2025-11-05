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
    <div style={{ width: "100%" }}>
      <style>
        {`
          .event-info-wrapper {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: clamp(20px, 4vw, 32px);
            width: 100%;
          }
          .event-info-col {
            display: flex;
            flex-direction: column;
            gap: clamp(12px, 2.5vw, 18px);
            min-width: 0;
          }
          .event-info-item {
            margin: 0;
            padding-bottom: clamp(10px, 2vw, 14px);
            border-bottom: 1px solid rgba(0, 0, 0, 0.15);
            display: flex;
            align-items: flex-start;
            gap: 8px;
          }
          .event-info-col:last-child .event-info-item:last-child {
            border-bottom: 1px solid rgba(0, 0, 0, 0.15);
            padding-bottom: clamp(10px, 2vw, 14px);
          }
          .event-info-label {
            font-weight: 600;
            display: inline-block;
            min-width: clamp(75px, 12vw, 100px);
            color: #333333;
            font-size: clamp(13px, 1.6vw, 15px);
            flex-shrink: 0;
            white-space: nowrap;
            line-height: 1.5;
          }
          .event-info-value {
            color: #000000;
            font-weight: 400;
            font-size: clamp(13px, 1.6vw, 15px);
            flex: 1;
            min-width: 0;
            word-break: break-word;
            line-height: 1.5;
          }
          @media (max-width: 768px) {
            .event-info-wrapper {
              grid-template-columns: 1fr 1fr;
              gap: clamp(16px, 3vw, 24px);
            }
            .event-info-col {
              gap: clamp(10px, 2vw, 14px);
            }
            .event-info-item {
              padding-bottom: clamp(8px, 1.5vw, 12px);
            }
            .event-info-label {
              min-width: clamp(70px, 10vw, 90px);
              font-size: clamp(12px, 1.8vw, 14px);
            }
            .event-info-value {
              font-size: clamp(12px, 1.8vw, 14px);
            }
          }
          @media (max-width: 480px) {
            .event-info-wrapper {
              display: flex;
              flex-direction: column;
              gap: clamp(12px, 2.5vw, 16px);
            }
            .event-info-col {
              gap: clamp(10px, 2vw, 12px);
            }
            .event-info-item {
              padding-bottom: clamp(8px, 1.5vw, 10px);
            }
            .event-info-label {
              min-width: clamp(65px, 8vw, 80px);
              font-size: clamp(11px, 2vw, 13px);
            }
            .event-info-value {
              font-size: clamp(11px, 2vw, 13px);
            }
          }
        `}
      </style>
      <div className="event-info-wrapper">
        <div className="event-info-col">
          <div className="event-info-item event-title">
            <span className="event-info-label">Event Title:</span>
            <span className="event-info-value">{event?.name || 'N/A'}</span>
          </div>
          <div className="event-info-item track-title">
            <span className="event-info-label">Track Title:</span>
            <span className="event-info-value">{track?.title || 'N/A'}</span>
          </div>
        </div>
        <div className="event-info-col">
          <div className="event-info-item date">
            <span className="event-info-label">Date:</span>
            <span className="event-info-value">
              {formatDate(event?.startDate)} - {formatDate(event?.endDate)}
            </span>
          </div>
          <div className="event-info-item time">
            <span className="event-info-label">Time:</span>
            <span className="event-info-value">
              {formatTime(session?.startTime)} - {formatTime(session?.endTime)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventInfoSection;

