import React from 'react';

const ActionButtons = ({ question, onAnswer, onEdit, onDelete }) => {
  const handleAnswerClick = () => {
    if (question.status === "answering") {
      return;
    }
    onAnswer(question);
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", gap: "0" }}>
      {/* Answer Now Button */}
      <button
        className="btn btn-icon"
        style={{
          width: "38px",
          height: "38px",
          borderRadius: "50%",
          border: "none",
          backgroundColor: "transparent",
          cursor: question.status === "answering" ? "not-allowed" : "pointer",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          padding: 0,
          margin: "0 -2px",
          color: question.status === "answering" ? "#D4D6DD" : question.answer ? "#28a745" : "#71C0BB",
          opacity: question.status === "answering" ? 0.5 : 1
        }}
        onClick={handleAnswerClick}
        disabled={question.status === "answering"}
        title={question.status === "answering" ? "Currently Being Answered" : question.answer ? "Edit Answer" : "Answer Now"}
      >
        <i className="feather icon-message-circle" style={{ fontSize: "20px" }}></i>
      </button>
      
      {/* Edit Question Button */}
      <button
        className="btn btn-icon"
        style={{
          width: "38px",
          height: "38px",
          borderRadius: "50%",
          border: "none",
          backgroundColor: "transparent",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          padding: 0,
          margin: "0 -2px",
          color: "#71C0BB"
        }}
        title="Edit Question"
        onClick={() => onEdit(question)}
      >
        <i className="feather icon-edit" style={{ fontSize: "20px" }}></i>
      </button>
      
      {/* Delete Question Button */}
      <button
        className="btn btn-icon"
        style={{
          width: "38px",
          height: "38px",
          borderRadius: "50%",
          border: "none",
          backgroundColor: "transparent",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          padding: 0,
          margin: "0 -2px",
          color: "#71C0BB"
        }}
        onClick={() => onDelete(question.id)}
        title="Delete Question"
      >
        <i className="feather icon-trash-2" style={{ fontSize: "20px" }}></i>
      </button>
    </div>
  );
};

export default ActionButtons;

