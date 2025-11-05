import React from 'react';
import ActionButtons from './ActionButtons';

const getStatusColor = (status) => {
  switch (status) {
    case "answered":
      return "#4E6688";
    case "approved":
      return "#71C0BB";
    default:
      return "#ffffff";
  }
};

const getStatusText = (status) => {
  if (status === "answered") return "Answered";
  if (status === "approved") return "Approved";
  return "Not Answered";
};

const QuestionRow = ({ question, onQuestionClick, onAnswer, onEdit, onDelete, onGenerateLink }) => {
  // If onQuestionClick is provided (new QnAShareLinkPage), use simple click handler
  // Otherwise, use old behavior with ActionButtons (TrackQnAShareLinkPage)
  const isNewVersion = !!onQuestionClick;

  const handleQuestionClick = (e) => {
    if (isNewVersion) {
      e.preventDefault();
      e.stopPropagation();
      if (onQuestionClick) {
        onQuestionClick(question);
      }
      return false;
    } else if (onGenerateLink) {
      // Old behavior for TrackQnAShareLinkPage
      e.preventDefault();
      e.stopPropagation();
      onGenerateLink(question);
      return false;
    }
  };

  if (isNewVersion) {
    // New version: Simple row with just question and votes (QnAShareLinkPage)
    return (
      <tr key={question.id}>
        <td 
          onClick={handleQuestionClick}
          onMouseDown={(e) => {
            if (isNewVersion) {
              e.preventDefault();
            }
          }}
          style={{ 
          backgroundColor: "#71C0BB",
          color: "#000000",
          fontWeight: "bold",
          fontStyle: "italic",
          borderRight: "1px solid #D4D6DD",
          borderTop: "1px solid #D4D6DD",
          borderBottom: "1px solid #D4D6DD",
          borderLeft: "none",
          padding: "6px 12px",
          wordBreak: "break-word",
          wordWrap: "break-word",
          whiteSpace: "normal",
          lineHeight: "1.4",
          verticalAlign: "middle",
          fontSize: "clamp(14px, 2vw, 18px)",
          textAlign: "start",
          cursor: "pointer",
          transition: "all 0.2s ease"
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = "#5a9a96";
          e.target.style.color = "#000000";
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = "#71C0BB";
          e.target.style.color = "#000000";
        }}
        >
          {question.question}
        </td>
        <td style={{ 
          backgroundColor: "#71C0BB",
          color: "#000000",
          borderRight: "none",
          borderTop: "1px solid #D4D6DD",
          borderBottom: "1px solid #D4D6DD",
          borderLeft: "1px solid #D4D6DD",
          padding: "4px 1px", 
          textAlign: "center",
          verticalAlign: "middle",
          fontSize: "clamp(14px, 2vw, 18px)",
          fontWeight: "600",
          whiteSpace: "nowrap"
        }}>
          {question.likesCount || 0}
        </td>
      </tr>
    );
  }

  // Old version: Full row with status and actions for TrackQnAShareLinkPage
  return (
    <tr key={question.id}>
      <td 
        onClick={handleQuestionClick}
        onMouseDown={(e) => {
          if (isNewVersion) {
            e.preventDefault();
          }
        }}
        style={{ 
        backgroundColor: getStatusColor(question.status),
        color: "black",
        fontWeight: "bold",
        fontStyle: "italic",
        borderRight: "1px solid #D4D6DD",
        borderTop: "1px solid #D4D6DD",
        borderBottom: "1px solid #D4D6DD",
        borderLeft: "none",
        padding: "6px 12px",
        wordBreak: "break-word",
        wordWrap: "break-word",
        whiteSpace: "normal",
        lineHeight: "1.2",
        verticalAlign: "middle",
        fontSize: "clamp(11px, 2vw, 15px)",
        textAlign: "start",
        cursor: onGenerateLink ? "pointer" : "default",
        transition: "all 0.2s ease"
      }}
      onMouseEnter={(e) => {
        if (onGenerateLink) {
          const currentColor = getStatusColor(question.status);
          e.target.style.backgroundColor = currentColor === "#ffffff" ? "#f0f0f0" : 
            currentColor === "#71C0BB" ? "#5fa8a3" : 
            currentColor === "#4E6688" ? "#3d4f6a" : 
            "#f0f0f0";
        }
      }}
      onMouseLeave={(e) => {
        e.target.style.backgroundColor = getStatusColor(question.status);
      }}
      >
        {question.question}
      </td>
      <td style={{ 
        backgroundColor: "#ffffff",
        color: "black",
        borderRight: "1px solid #D4D6DD",
        borderTop: "1px solid #D4D6DD",
        borderBottom: "1px solid #D4D6DD",
        borderLeft: "1px solid #D4D6DD",
        padding: "4px 1px", 
        textAlign: "center",
        verticalAlign: "middle",
        fontSize: "clamp(11px, 2vw, 15px)",
        whiteSpace: "nowrap"
      }}>
        {question.likesCount || 0}
      </td>
      <td style={{ 
        backgroundColor: "#ffffff",
        color: "black",
        borderRight: "1px solid #D4D6DD",
        borderTop: "1px solid #D4D6DD",
        borderBottom: "1px solid #D4D6DD",
        borderLeft: "1px solid #D4D6DD",
        padding: "4px 1px",
        textAlign: "center",
        verticalAlign: "middle",
        wordBreak: "break-word",
        wordWrap: "break-word",
        whiteSpace: "normal",
        fontSize: "clamp(11px, 2vw, 15px)"
      }}>
        {question.status === "approved" && (
          <i className="feather icon-check-circle mr-1" style={{ color: "#71C0BB" }}></i>
        )}
        {getStatusText(question.status)}
      </td>
      <td style={{ 
        backgroundColor: "#ffffff",
        color: "black",
        borderRight: "none",
        borderTop: "1px solid #D4D6DD",
        borderBottom: "1px solid #D4D6DD",
        borderLeft: "1px solid #D4D6DD",
        padding: "4px 1px", 
        textAlign: "center",
        verticalAlign: "middle"
      }}>
        <ActionButtons question={question} onAnswer={onAnswer} onEdit={onEdit} onDelete={onDelete} onGenerateLink={onGenerateLink} />
      </td>
    </tr>
  );
};

export default QuestionRow;

