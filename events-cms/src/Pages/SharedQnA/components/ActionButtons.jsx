import React from 'react';

const ActionButtons = ({ question, onAnswer, onEdit, onDelete, onGenerateLink }) => {
  const handleAnswerClick = () => {
    // Disable if answered, approval, or answering
    if (question.status === "answered" || question.status === "approval" || question.status === "answering") {
      return;
    }
    onAnswer(question);
    // Generate and display question link
    if (onGenerateLink) {
      onGenerateLink(question);
    }
  };

  const handleEditClick = () => {
    onEdit(question);
    // Generate and display question link
    if (onGenerateLink) {
      onGenerateLink(question);
    }
  };

  const handleDeleteClick = () => {
    onDelete(question.id);
    // Generate and display question link
    if (onGenerateLink) {
      onGenerateLink(question);
    }
  };

  return (
    <div>
      <style>
        {`
          .action-buttons-wrapper {
            display: flex;
            justify-content: center;
            gap: 0;
          }
          .action-buttons-wrapper button {
            width: 50px;
            height: 50px;
            margin: 0 2px;
          }
          .action-buttons-wrapper button i {
            font-size: 28px !important;
          }
          @media (max-width: 768px) {
            .action-buttons-wrapper button {
              width: 40px;
              height: 40px;
              margin: 0 -6px;
            }
            .action-buttons-wrapper button i {
              font-size: 22px !important;
            }
          }
        `}
      </style>
      <div className="action-buttons-wrapper">
        {/* Answer Now Button (QA Icon) */}
        <button
          className="btn btn-icon"
          style={{
            borderRadius: "50%",
            border: "none",
            backgroundColor: "transparent",
            cursor: (question.status === "answered" || question.status === "approval" || question.status === "answering") ? "not-allowed" : "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            padding: 0,
            color: (question.status === "answered" || question.status === "approval" || question.status === "answering") ? "#D4D6DD" : "#71C0BB",
            opacity: (question.status === "answered" || question.status === "approval" || question.status === "answering") ? 0.5 : 1
          }}
          onClick={handleAnswerClick}
          disabled={question.status === "answered" || question.status === "approval" || question.status === "answering"}
          title={
            question.status === "answered" 
              ? "Question Already Answered" 
              : question.status === "approval" 
                ? "Question Already Approved" 
                : question.status === "answering"
                  ? "Question Currently Being Answered"
                  : "Approve Question"
          }
        >
          <i className="feather icon-message-circle"></i>
        </button>
        
        {/* Edit Question Button */}
        <button
          className="btn btn-icon"
          style={{
            borderRadius: "50%",
            border: "none",
            backgroundColor: "transparent",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            padding: 0,
            color: "#71C0BB"
          }}
          title="Edit Question"
          onClick={handleEditClick}
        >
          <i className="feather icon-edit"></i>
        </button>
        
        {/* Delete Question Button */}
        <button
          className="btn btn-icon"
          style={{
            borderRadius: "50%",
            border: "none",
            backgroundColor: "transparent",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            padding: 0,
            color: "#71C0BB"
          }}
          onClick={handleDeleteClick}
          title="Delete Question"
        >
          <i className="feather icon-trash-2"></i>
        </button>
      </div>
    </div>
  );
};

export default ActionButtons;

