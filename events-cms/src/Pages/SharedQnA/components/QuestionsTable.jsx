import React from 'react';
import { Table } from 'react-bootstrap';
import QuestionRow from './QuestionRow';

const QuestionsTable = ({ questions, onAnswer, onEdit, onDelete, onGenerateLink, voteFilterActive, statusFilterValue, onVoteFilterClick, onStatusFilterClick, onResetFilters, onVoteFilterReset, onStatusFilterReset }) => {
  return (
    <div>
      <style>
        {`
          .table-scroll-container::-webkit-scrollbar {
            width: 0px;
            height: 0px;
            display: none;
          }
          .table-scroll-container {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .questions-table th {
            font-size: 18px;
          }
          .questions-table th i.feather {
            font-size: 16px;
          }
          @media (max-width: 768px) {
            .questions-table th {
              font-size: 13px;
            }
            .questions-table th i.feather {
              font-size: 12px;
            }
          }
          @media (max-width: 425px) {
            .questions-table th {
              font-size: 11px;
            }
            .questions-table th i.feather {
              font-size: 10px;
            }
          }
        `}
      </style>
      <div className="table-responsive table-scroll-container" style={{ 
        marginTop: "20px", 
        overflowX: "auto", 
        overflowY: "auto",
        maxHeight: "calc(100vh - 400px)",
        WebkitOverflowScrolling: "touch" 
      }}>
        <Table bordered className="questions-table" style={{ 
          borderCollapse: 'separate', 
          borderSpacing: '0',
          width: '100%', 
          minWidth: '320px',
          border: "1px solid #D4D6DD",
          fontSize: "clamp(12px, 2vw, 16px)"
        }}>
        <thead style={{ backgroundColor: "#000", color: "white", position: "sticky", top: 0, zIndex: 10 }}>
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
              textAlign: "center"
            }}>Questions</th>
            <th 
              onClick={onVoteFilterClick}
              style={{ 
                borderRight: "1px solid #D4D6DD",
                borderTop: "none",
                borderBottom: "1px solid #D4D6DD",
                borderLeft: "1px solid #D4D6DD",
                padding: "4px 2px", 
                backgroundColor: voteFilterActive ? "#71C0BB" : "#000", 
                color: "white",
                width: "8%",
                minWidth: "35px",
                maxWidth: "50px",
                textAlign: "center",
                cursor: "pointer",
                userSelect: "none",
                position: "relative"
              }}
              title={
                voteFilterActive === null 
                  ? "Click to sort by votes" 
                  : voteFilterActive === 'desc' 
                    ? "Sorted: high to low (2,1,0) - Click for low to high" 
                    : "Sorted: low to high (0,1,2) - Click for high to low"
              }
            >
              Votes {voteFilterActive && <i className="feather icon-filter"></i>}
              {voteFilterActive && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onVoteFilterReset();
                  }}
                  style={{
                    position: "absolute",
                    right: "2px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                    color: "white",
                    border: "none",
                    borderRadius: "50%",
                    width: "16px",
                    height: "16px",
                    cursor: "pointer",
                    fontSize: "10px",
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    lineHeight: 1
                  }}
                  title="Reset vote filter"
                >
                  ×
                </button>
              )}
            </th>
            <th 
              onClick={onStatusFilterClick}
              style={{ 
                borderRight: "1px solid #D4D6DD",
                borderTop: "none",
                borderBottom: "1px solid #D4D6DD",
                borderLeft: "1px solid #D4D6DD",
                padding: "4px 2px", 
                backgroundColor: statusFilterValue ? "#71C0BB" : "#000", 
                color: "white",
                width: "15%",
                minWidth: "55px",
                maxWidth: "80px",
                textAlign: "center",
                cursor: "pointer",
                userSelect: "none",
                position: "relative"
              }}
              title={
                statusFilterValue === null 
                  ? "Click to filter by status" 
                  : statusFilterValue === 'answering' 
                    ? "Showing answering - Click for answered" 
                    : statusFilterValue === 'answered'
                      ? "Showing answered - Click for not answered"
                      : "Showing not answered - Click for answering"
              }
            >
              Status {statusFilterValue && <i className="feather icon-filter"></i>}
              {statusFilterValue && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusFilterReset();
                  }}
                  style={{
                    position: "absolute",
                    right: "2px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                    color: "white",
                    border: "none",
                    borderRadius: "50%",
                    width: "16px",
                    height: "16px",
                    cursor: "pointer",
                    fontSize: "10px",
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    lineHeight: 1
                  }}
                  title="Reset status filter"
                >
                  ×
                </button>
              )}
            </th>
            <th style={{ 
              borderRight: "none",
              borderTop: "none",
              borderBottom: "1px solid #D4D6DD",
              borderLeft: "1px solid #D4D6DD",
              padding: "4px 1px", 
              backgroundColor: "#000", 
              color: "white",
              width: "18%",
              minWidth: "100px",
              maxWidth: "135px",
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
    </div>
  );
};

export default QuestionsTable;

