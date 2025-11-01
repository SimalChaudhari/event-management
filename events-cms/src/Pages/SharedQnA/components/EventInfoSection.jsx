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
            display: flex;
            flex-wrap: nowrap;
            gap: 8px;
            justify-content: space-between;
            overflow-x: auto;
          }
          @media (max-width: 320px) {
            .event-info-wrapper {
              flex-direction: column;
              flex-wrap: wrap;
            }
            .event-info-wrapper > div {
              min-width: 100% !important;
            }
          }
        `}
      </style>
      <div className="event-info-wrapper">
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", flexShrink: 0, minWidth: "140px" }}>
          <p style={{ margin: 0, fontSize: "clamp(11px, 2vw, 16px)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            <strong>Event Title:</strong> {event?.name || 'N/A'}
          </p>
          <p style={{ margin: 0, fontSize: "clamp(11px, 2vw, 16px)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            <strong>Track Title:</strong> {track?.title || 'N/A'}
          </p>
          <p style={{ margin: 0, fontSize: "clamp(11px, 2vw, 16px)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            <strong>Session Title:</strong> {session?.title || 'N/A'}
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", flexShrink: 0, minWidth: "140px" }}>
          <p style={{ margin: 0, fontSize: "clamp(11px, 2vw, 16px)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            <strong>Start Date:</strong> {formatDate(event?.startDate)}
          </p>
          <p style={{ margin: 0, fontSize: "clamp(11px, 2vw, 16px)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            <strong>End Date:</strong> {formatDate(event?.endDate)}
          </p>
          <p style={{ margin: 0, fontSize: "clamp(11px, 2vw, 16px)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            <strong>Time:</strong> {formatTime(session?.startTime)} - {formatTime(session?.endTime)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default EventInfoSection;

