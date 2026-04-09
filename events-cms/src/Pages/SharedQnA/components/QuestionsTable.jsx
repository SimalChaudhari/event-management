import React, { useRef, useEffect } from 'react';
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
  onStatusFilterReset, // Old prop for TrackQnAShareLinkPage
  isLoading // Optional prop to track loading state
}) => {
  // Determine if we're using new version (QnAShareLinkPage) or old version (TrackQnAShareLinkPage)
  const isNewVersion = !!onQuestionClick;
  const colSpan = isNewVersion ? 2 : 4;
  
  // Dynamic font sizes for QnAShareLinkPage - using clamp for responsive sizing
  const thFontSize = isNewVersion ? 'clamp(14px, 3vw, 24px)' : '18px';
  const thIconFontSize = isNewVersion ? 'clamp(12px, 2.5vw, 22px)' : '16px';
  const thFontSizeTablet = isNewVersion ? '18px' : '13px';
  const thIconFontSizeTablet = isNewVersion ? '16px' : '12px';
  const thFontSizeMobile = isNewVersion ? '14px' : '11px';
  const thIconFontSizeMobile = isNewVersion ? '12px' : '10px';
  
  // Ref for scroll container
  const scrollContainerRef = useRef(null);
  const hasResetRef = useRef(false);
  
  // Reset scroll to top when page loads/refreshes and data is ready
  useEffect(() => {
    if (!isNewVersion || isLoading) return;
    
    if (scrollContainerRef.current && questions.length > 0 && !hasResetRef.current) {
      // Reset scroll immediately
      scrollContainerRef.current.scrollTop = 0;
      hasResetRef.current = true;
      
      // Also reset after a small delay to ensure it sticks
      const timer = setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = 0;
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isLoading, questions.length, isNewVersion]);
  
  // Reset the flag when component unmounts (page refresh)
  useEffect(() => {
    hasResetRef.current = false;
    return () => {
      hasResetRef.current = false;
    };
  }, []);
  
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
          ${isNewVersion ? `
          .table-scroll-container::-webkit-scrollbar {
            width: clamp(10px, 1.5vw, 14px);
            height: clamp(10px, 1.5vw, 14px);
          }
          .table-scroll-container::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.1);
            border-radius: 10px;
          }
          .table-scroll-container::-webkit-scrollbar-thumb {
            background: rgba(0, 0, 0, 0.5);
            border-radius: 10px;
          }
          .table-scroll-container::-webkit-scrollbar-thumb:hover {
            background: rgba(0, 0, 0, 0.7);
          }
          .table-scroll-container {
            scrollbar-width: thin;
            scrollbar-color: rgba(0, 0, 0, 0.5) rgba(0, 0, 0, 0.1);
            scroll-behavior: smooth;
            overflow-y: auto;
            overflow-x: auto;
          }
          ` : `
          .table-scroll-container::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          .table-scroll-container::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.1);
            border-radius: 10px;
          }
          .table-scroll-container::-webkit-scrollbar-thumb {
            background: rgba(0, 0, 0, 0.5);
            border-radius: 10px;
          }
          .table-scroll-container::-webkit-scrollbar-thumb:hover {
            background: rgba(0, 0, 0, 0.7);
          }
          .table-scroll-container {
            scrollbar-width: thin;
            scrollbar-color: rgba(0, 0, 0, 0.5) rgba(0, 0, 0, 0.1);
            scroll-behavior: smooth;
            overflow-y: auto;
            overflow-x: auto;
          }
          `}
          @media (max-width: 600px) {
            .questions-table {
              font-size: clamp(10px, 3vw, 14px) !important;
            }
            .questions-table th,
            .questions-table td {
              padding: clamp(4px, 1.5vw, 8px) clamp(6px, 2vw, 12px) !important;
            }
          }
          @media (max-width: 400px) {
            .questions-table {
              font-size: clamp(9px, 3.5vw, 12px) !important;
            }
            .questions-table th,
            .questions-table td {
              padding: clamp(3px, 1.2vw, 6px) clamp(4px, 1.5vw, 8px) !important;
            }
          }
          @media (max-width: 300px) {
            .questions-table {
              font-size: clamp(8px, 4vw, 11px) !important;
            }
            .questions-table th,
            .questions-table td {
              padding: clamp(2px, 1vw, 5px) clamp(3px, 1.2vw, 6px) !important;
            }
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
      <div 
        style={{
          border: isNewVersion ? "clamp(4px, 0.6vw, 1px) solid #71C0BB" : "none",
          // borderRadius: isNewVersion ? "clamp(10px, 1.2vw, 14px)" : "0",
          padding: isNewVersion ? "0" : "0",
          width: "100%",
          maxWidth: "100%",
          minWidth: "300px",
          boxShadow: isNewVersion ? "0 6px 12px rgba(113, 192, 187, 0.2), 0 2px 4px rgba(113, 192, 187, 0.1)" : "none",
          backgroundColor: isNewVersion ? "#ffffff" : "transparent",
          overflow: "hidden"
        }}
      >
        <div 
          ref={(el) => {
            scrollContainerRef.current = el;
            // Ensure scroll starts at top when element is created
            if (el && isNewVersion) {
              el.scrollTop = 0;
            }
          }}
          className="table-responsive table-scroll-container" 
          style={{ 
            marginTop: !isNewVersion ? "0" : "0", 
            overflowX: "auto", 
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
            height: isNewVersion ? "calc(100vh - clamp(100px, 15vw, 120px))" : "auto",
            minHeight: isNewVersion ? "calc(100vh - clamp(100px, 15vw, 120px))" : "auto",
            maxHeight: isNewVersion ? "calc(100vh - clamp(100px, 15vw, 120px))" : "calc(100vh - 100px)",
            display: "flex",
            flexDirection: "column",
            position: "relative",
            width: "100%",
            maxWidth: "100%",
            minWidth: "300px",
            borderRadius: isNewVersion ? "clamp(8px, 1vw, 12px)" : "0"
          }}>
        <Table bordered className="questions-table" style={{ 
          borderCollapse: 'separate', 
          borderSpacing: '0',
          width: '100%', 
          minWidth: '300px',
          maxWidth: '100%',
          border: "1px solid #D4D6DD",
          fontSize: isNewVersion ? "clamp(12px, 1.5vw, 18px)" : "clamp(12px, 2vw, 16px)",
          tableLayout: 'auto'
        }}>
        <thead style={{ backgroundColor: "#000", color: "white", position: "sticky", top: 0, zIndex: 10 }}>
          <tr>
            <th style={{ 
              borderRight: "1px solid #D4D6DD",
              borderTop: "none",
              borderBottom: "1px solid #D4D6DD",
              borderLeft: "none",
              padding: isNewVersion ? "clamp(6px, 1.5vw, 12px) clamp(8px, 2vw, 16px)" : "8px 4px", 
              backgroundColor: "#000", 
              color: "white",
              width: isNewVersion ? "auto" : "52%",
              minWidth: isNewVersion ? "200px" : "100px",
              textAlign: "center",
              fontSize: isNewVersion ? "clamp(12px, 2vw, 22px)" : thFontSize,
              whiteSpace: "normal",
              wordWrap: "break-word"
            }}>Questions</th>
            <th 
              onClick={onVoteFilterClick}
              style={{ 
                borderRight: isNewVersion ? "none" : "1px solid #D4D6DD",
                borderTop: "none",
                borderBottom: "1px solid #D4D6DD",
                borderLeft: "1px solid #D4D6DD",
                padding: isNewVersion ? "clamp(6px, 1.2vw, 10px) clamp(8px, 1.5vw, 12px)" : "4px 2px", 
                backgroundColor: voteFilterActive ? "#71C0BB" : "#000", 
                color: "white",
                width: isNewVersion ? "auto" : "8%",
                minWidth: isNewVersion ? "clamp(50px, 10vw, 70px)" : "30px",
                maxWidth: isNewVersion ? "none" : "40px",
                textAlign: "center",
                cursor: "pointer",
                userSelect: "none",
                position: "relative",
                fontSize: isNewVersion ? "clamp(11px, 2vw, 18px)" : thFontSize,
                whiteSpace: "nowrap",
                overflow: "visible"
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
    </div>
  );
};

export default QuestionsTable;

