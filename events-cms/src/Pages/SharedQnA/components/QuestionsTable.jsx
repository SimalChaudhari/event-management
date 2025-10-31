import React from 'react';
import { Table } from 'react-bootstrap';
import QuestionRow from './QuestionRow';

const QuestionsTable = ({ questions, onAnswer, onEdit, onDelete, onGenerateLink }) => {
  return (
    <div className="table-responsive" style={{ marginTop: "20px", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
      <Table bordered style={{ 
        borderCollapse: 'separate', 
        borderSpacing: '0',
        width: '100%', 
        minWidth: '320px',
        border: "1px solid #D4D6DD",
        fontSize: "clamp(10px, 2vw, 14px)"
      }}>
        <thead style={{ backgroundColor: "#000", color: "white" }}>
          <tr>
            <th style={{ 
              borderRight: "1px solid #D4D6DD",
              borderTop: "none",
              borderBottom: "1px solid #D4D6DD",
              borderLeft: "none",
              padding: "8px 4px", 
              backgroundColor: "#000", 
              color: "white",
              width: "52%",
              minWidth: "100px",
              fontSize: "clamp(11px, 2vw, 14px)",
              textAlign: "center"
            }}>Questions</th>
            <th style={{ 
              borderRight: "1px solid #D4D6DD",
              borderTop: "none",
              borderBottom: "1px solid #D4D6DD",
              borderLeft: "1px solid #D4D6DD",
              padding: "4px 2px", 
              backgroundColor: "#000", 
              color: "white",
              width: "8%",
              minWidth: "35px",
              maxWidth: "50px",
              fontSize: "clamp(10px, 2vw, 14px)",
              textAlign: "center"
            }}>Votes</th>
            <th style={{ 
              borderRight: "1px solid #D4D6DD",
              borderTop: "none",
              borderBottom: "1px solid #D4D6DD",
              borderLeft: "1px solid #D4D6DD",
              padding: "4px 2px", 
              backgroundColor: "#000", 
              color: "white",
              width: "15%",
              minWidth: "55px",
              maxWidth: "80px",
              fontSize: "clamp(10px, 2vw, 14px)",
              textAlign: "center"
            }}>Status</th>
            <th style={{ 
              borderRight: "none",
              borderTop: "none",
              borderBottom: "1px solid #D4D6DD",
              borderLeft: "1px solid #D4D6DD",
              padding: "4px 1px", 
              backgroundColor: "#000", 
              color: "white",
              width: "18%",
              minWidth: "70px",
              maxWidth: "110px",
              fontSize: "clamp(10px, 2vw, 14px)",
              textAlign: "center"
            }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {questions.length > 0 ? (
            questions.map((q) => (
              <QuestionRow key={q.id} question={q} onAnswer={onAnswer} onEdit={onEdit} onDelete={onDelete} onGenerateLink={onGenerateLink} />
            ))
          ) : (
            <tr>
              <td colSpan="4" className="text-center text-muted py-4">
                <i className="fas fa-inbox fa-2x mb-2"></i>
                <br />
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>
  );
};

export default QuestionsTable;

