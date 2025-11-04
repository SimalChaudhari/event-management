import React from "react";
import { Button } from "react-bootstrap";

const FullScreenQuestionPopup = ({
  show,
  question,
  backgroundImageUrl,
  markingAsAnswered,
  onClose,
  onMarkAsAnswered
}) => {
  if (!show || !question) {
    return null;
  }

  return (
    <div
      onClick={(e) => {
        // Close popup if clicking on background
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden"
      }}
    >
      {/* Background Image or Fallback Color Gradient */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          ...(backgroundImageUrl ? {
            backgroundImage: `url(${backgroundImageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundAttachment: "fixed",
            filter: "blur(2px)",
            backgroundColor: "transparent"
          } : {
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            backgroundSize: "cover",
            backgroundPosition: "center"
          }),
          zIndex: 0
        }}
      />
      
      {/* Light overlay for better text visibility */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: backgroundImageUrl 
          ? "rgba(255, 255, 255, 0.3)" 
          : "rgba(255, 255, 255, 0.15)",
        zIndex: 1
      }}></div>

      {/* Close Button (X) - Top Right */}
      <button
        onClick={onClose}
        disabled={markingAsAnswered}
        style={{
          position: "absolute",
          top: "clamp(15px, 2vh, 25px)",
          right: "clamp(15px, 2vw, 30px)",
          width: "clamp(35px, calc(30px + 1vw), 45px)",
          height: "clamp(35px, calc(30px + 1vw), 45px)",
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          border: "none",
          borderRadius: "50%",
          cursor: markingAsAnswered ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "clamp(18px, calc(16px + 0.5vw), 22px)",
          fontWeight: "bold",
          color: "#333",
          zIndex: 10000,
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
          transition: "all 0.2s ease"
        }}
        onMouseEnter={(e) => {
          if (!markingAsAnswered) {
            e.target.style.backgroundColor = "rgba(255, 255, 255, 1)";
            e.target.style.transform = "scale(1.1)";
          }
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
          e.target.style.transform = "scale(1)";
        }}
      >
        ×
      </button>

      {/* Question Content */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          padding: "clamp(20px, 3vw, 60px) clamp(20px, 4vw, 80px)",
          boxSizing: "border-box",
          maxWidth: "100%"
        }}
      >
        {/* Question Text Container */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            padding: "clamp(10px, 1.5vw, 30px)",
            boxSizing: "border-box",
            maxWidth: "100%"
          }}
        >
          <h1
            style={{
              color: "#000000",
              fontWeight: "700",
              fontStyle: "italic",
              fontSize: "clamp(20px, calc(24px + 1.5vw), 42px)",
              lineHeight: "1.4",
              wordBreak: "break-word",
              margin: 0,
              textAlign: "center",
              padding: "clamp(10px, 1.5vw, 25px)",
              fontFamily: "Arial, sans-serif",
              letterSpacing: "0.5px",
              textShadow: "2px 2px 8px rgba(255, 255, 255, 0.8), 0 0 16px rgba(255, 255, 255, 0.6), -2px -2px 8px rgba(255, 255, 255, 0.8)",
              maxWidth: "90%",
              width: "100%"
            }}
          >
            {question.question}
          </h1>
        </div>

        {/* Mark as Answered Button - Right Side */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "flex-end",
            width: "100%",
            padding: "clamp(10px, 1.5vw, 25px)",
            boxSizing: "border-box"
          }}
        >
          <Button
            onClick={onMarkAsAnswered}
            disabled={markingAsAnswered}
            style={{
              backgroundColor: markingAsAnswered ? "#6c757d" : "#71C0BB",
              borderColor: markingAsAnswered ? "#6c757d" : "#71C0BB",
              color: "white",
              padding: "clamp(10px, 1.2vw, 14px) clamp(25px, 3vw, 45px)",
              fontSize: "clamp(14px, calc(14px + 0.5vw), 18px)",
              fontWeight: "600",
              borderRadius: "8px",
              border: "none",
              cursor: markingAsAnswered ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
              minWidth: "clamp(150px, calc(160px + 2vw), 220px)",
              whiteSpace: "nowrap"
            }}
            onMouseEnter={(e) => {
              if (!markingAsAnswered) {
                e.target.style.backgroundColor = "#5fa8a3";
                e.target.style.transform = "scale(1.05)";
              }
            }}
            onMouseLeave={(e) => {
              if (!markingAsAnswered) {
                e.target.style.backgroundColor = "#71C0BB";
                e.target.style.transform = "scale(1)";
              }
            }}
          >
            {markingAsAnswered ? 'Marking...' : 'Mark as Answered'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FullScreenQuestionPopup;

