import React from 'react';
import { Table } from 'react-bootstrap';
import QuestionRow from './QuestionRow';

const QuestionsTable = ({ 
  questions, 
  onQuestionClick, // New prop for QnAShareLinkPage
  onAnswer, // Old props for TrackQnAShareLinkPage
  onEdit,
  onDelete,
  onGenerateLink,
  voteFilterActive, 
  statusFilterValue, // Old prop for TrackQnAShareLinkPage
  onVoteFilterClick, 
  onStatusFilterClick, // Old prop for TrackQnAShareLinkPage
  onResetFilters, 
  onVoteFilterReset,
  onStatusFilterReset // Old prop for TrackQnAShareLinkPage
}) => {
  // Determine if we're using new version (QnAShareLinkPage) or old version (TrackQnAShareLinkPage)
  const isNewVersion = !!onQuestionClick;
  const colSpan = isNewVersion ? 2 : 4;
  
  // Dynamic font sizes for QnAShareLinkPage
  const thFontSize = isNewVersion ? '20px' : '18px';
  const thIconFontSize = isNewVersion ? '18px' : '16px';
  const thFontSizeTablet = isNewVersion ? '15px' : '13px';
  const thIconFontSizeTablet = isNewVersion ? '14px' : '12px';
  const thFontSizeMobile = isNewVersion ? '13px' : '11px';
  const thIconFontSizeMobile = isNewVersion ? '12px' : '10px';
  
  return (
    <div>
      {/* Status Legend - Only show for TrackQnAShareLinkPage (not new version) */}
      {!isNewVersion && (
        <div className="d-flex align-items-center justify-content-end flex-wrap" style={{ 
          gap: "clamp(0.5rem, 1.5vw, 1rem)", 
          padding: "clamp(10px, 1.5vw, 14px) clamp(12px, 2vw, 16px)",
          backgroundColor: "#f8f9fa",
          borderBottom: "1px solid #e0e0e0"
        }}>
          <div className="d-flex align-items-center" style={{
            padding: "clamp(0.3rem, 1.2vw, 0.4rem) clamp(0.5rem, 1.5vw, 0.75rem)",
            borderRadius: "6px",
            flexShrink: 0
          }}>
            <div
              className="rounded"
              style={{
                width: "clamp(16px, 2vw, 20px)",
                height: "clamp(16px, 2vw, 20px)",
                border: "2px solid #333",
                marginRight: "clamp(5px, 1vw, 8px)",
                backgroundColor: "#ffffff",
                flexShrink: 0
              }}
            ></div>
            <span style={{ fontSize: "clamp(0.65rem, 1.4vw, 0.85rem)", fontWeight: 600, color: "#333", whiteSpace: "nowrap" }}>
              Not Answered
            </span>
          </div>
          <div className="d-flex align-items-center" style={{
            padding: "clamp(0.3rem, 1.2vw, 0.4rem) clamp(0.5rem, 1.5vw, 0.75rem)",
            borderRadius: "6px",
            flexShrink: 0
          }}>
            <div
              className="rounded"
              style={{
                width: "clamp(16px, 2vw, 20px)",
                height: "clamp(16px, 2vw, 20px)",
                backgroundColor: "#4E6688",
                marginRight: "clamp(5px, 1vw, 8px)",
                flexShrink: 0
              }}
            ></div>
            <span style={{ fontSize: "clamp(0.65rem, 1.4vw, 0.85rem)", fontWeight: 600, color: "#333", whiteSpace: "nowrap" }}>
              Answered
            </span>
          </div>
          <div className="d-flex align-items-center" style={{
            padding: "clamp(0.3rem, 1.2vw, 0.4rem) clamp(0.5rem, 1.5vw, 0.75rem)",
            borderRadius: "6px",
            flexShrink: 0
          }}>
            <div
              className="rounded d-flex align-items-center justify-content-center"
              style={{
                width: "clamp(16px, 2vw, 20px)",
                height: "clamp(16px, 2vw, 20px)",
                backgroundColor: "#71C0BB",
                marginRight: "clamp(5px, 1vw, 8px)",
                flexShrink: 0
              }}
            >
              <i className="feather icon-check-circle" style={{ color: "white", fontSize: "clamp(9px, 1.4vw, 12px)" }}></i>
            </div>
            <span style={{ fontSize: "clamp(0.65rem, 1.4vw, 0.85rem)", fontWeight: 600, color: "#333", whiteSpace: "nowrap" }}>
              Approved
            </span>
          </div>
        </div>
      )}
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
            font-size: ${thFontSize};
          }
          .questions-table th i.feather {
            font-size: ${thIconFontSize};
          }
          @media (max-width: 768px) {
            .questions-table th {
              font-size: ${thFontSizeTablet};
            }
            .questions-table th i.feather {
              font-size: ${thIconFontSizeTablet};
            }
          }
          @media (max-width: 425px) {
            .questions-table th {
              font-size: ${thFontSizeMobile};
            }
            .questions-table th i.feather {
              font-size: ${thIconFontSizeMobile};
            }
          }
        `}
      </style>
      <div className="table-responsive table-scroll-container" style={{ 
        marginTop: !isNewVersion ? "0" : "20px", 
        overflowX: "auto", 
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
        height: "auto",
        minHeight: "auto",
        maxHeight: "calc(100vh - 500px)",
        display: "flex",
        flexDirection: "column"
      }}>
        <Table bordered className="questions-table" style={{ 
          borderCollapse: 'separate', 
          borderSpacing: '0',
          width: '100%', 
          minWidth: '320px',
          border: "1px solid #D4D6DD",
          fontSize: isNewVersion ? "clamp(14px, 2vw, 18px)" : "clamp(12px, 2vw, 16px)"
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
              width: isNewVersion ? "85%" : "52%",
              minWidth: "100px",
              textAlign: "center"
            }}>Questions</th>
            <th 
              onClick={onVoteFilterClick}
              style={{ 
                borderRight: isNewVersion ? "none" : "1px solid #D4D6DD",
                borderTop: "none",
                borderBottom: "1px solid #D4D6DD",
                borderLeft: "1px solid #D4D6DD",
                padding: "4px 2px", 
                backgroundColor: voteFilterActive ? "#71C0BB" : "#000", 
                color: "white",
                width: isNewVersion ? "15%" : "8%",
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
            {!isNewVersion && (
              <>
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
                      : statusFilterValue === 'answered' 
                        ? "Showing answered - Click for approved" 
                        : statusFilterValue === 'approved'
                          ? "Showing approved - Click for not answered"
                          : "Showing not answered - Click for answered"
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
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {questions.length > 0 ? (
            questions.map((q) => (
              <QuestionRow 
                key={q.id} 
                question={q} 
                onQuestionClick={onQuestionClick}
                onAnswer={onAnswer}
                onEdit={onEdit}
                onDelete={onDelete}
                onGenerateLink={onGenerateLink}
              />
            ))
          ) : (
            <tr>
              <td colSpan={colSpan} className="text-center text-muted py-4">
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

