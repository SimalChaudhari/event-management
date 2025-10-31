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
      <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: "1", minWidth: "200px" }}>
          <p style={{ margin: 0, fontSize: "14px" }}>
            <strong>Event Title:</strong> {event?.name || 'N/A'}
          </p>
          <p style={{ margin: 0, fontSize: "14px" }}>
            <strong>Track Title:</strong> {track?.title || 'N/A'}
          </p>
          <p style={{ margin: 0, fontSize: "14px" }}>
            <strong>Session Title:</strong> {session?.title || 'N/A'}
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: "1", minWidth: "200px" }}>
          <p style={{ margin: 0, fontSize: "14px" }}>
            <strong>Start Date:</strong> {formatDate(event?.startDate)}
          </p>
          <p style={{ margin: 0, fontSize: "14px" }}>
            <strong>End Date:</strong> {formatDate(event?.endDate)}
          </p>
          <p style={{ margin: 0, fontSize: "14px" }}>
            <strong>Time:</strong> {formatTime(session?.startTime)} - {formatTime(session?.endTime)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default EventInfoSection;

