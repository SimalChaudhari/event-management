import React from 'react';
import ActionButtons from './ActionButtons';

const getStatusColor = (status) => {
  switch (status) {
    case "answering":
      return "#71C0BB";
    case "answered":
      return "#4E6688";
    default:
      return "#ffffff";
  }
};

const getStatusText = (status) => {
  if (status === "answered") return "Answered";
  if (status === "answering") return "Answering";
  return "Not Answered";
};

const QuestionRow = ({ question, onAnswer, onEdit, onDelete, onGenerateLink }) => {
  const handleQuestionClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onGenerateLink) {
      // Call immediately to ensure immediate state update
      onGenerateLink(question);
    }
  };

  return (
    <tr key={question.id}>
      <td 
        onClick={handleQuestionClick}
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
        fontSize: "clamp(10px, 2vw, 13px)",
        textAlign: "start",
        cursor: onGenerateLink ? "pointer" : "default",
        transition: "all 0.2s ease"
      }}
      onMouseEnter={(e) => {
        if (onGenerateLink) {
          e.target.style.backgroundColor = getStatusColor(question.status) === "#ffffff" ? "#f0f0f0" : 
            getStatusColor(question.status) === "#71C0BB" ? "#5fa8a3" : 
            getStatusColor(question.status) === "#4E6688" ? "#3d4f6a" : "#f0f0f0";
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
        fontSize: "clamp(10px, 2vw, 13px)",
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
        fontSize: "clamp(10px, 2vw, 13px)"
      }}>
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
        <ActionButtons question={question} onAnswer={onAnswer} onEdit={onEdit} onDelete={onDelete} />
      </td>
    </tr>
  );
};

export default QuestionRow;

