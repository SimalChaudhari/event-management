import React, { useRef, useEffect } from 'react';
import { Container, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { BASE_URL } from '../../../configs/env';

const UrlFieldAndLegend = ({ shareToken, answeringQuestionUrl, questionText, actualUrl }) => {
  const actualUrlRef = useRef(actualUrl);
  
  // Keep ref in sync with prop
  useEffect(() => {
    actualUrlRef.current = actualUrl;
  }, [actualUrl]);

  const handleCopyUrl = () => {
    // Copy the actual URL (with ID or shareToken) - use ref to avoid stale closure
    const fullUrl = actualUrlRef.current || answeringQuestionUrl || (shareToken ? `${BASE_URL}/qna/share/${shareToken}` : '');
    if (fullUrl) {
      navigator.clipboard.writeText(fullUrl).then(() => {
        toast.success('URL copied to clipboard!');
      }).catch(() => {
        toast.error('Failed to copy URL');
      });
    }
  };

  // Display URL with question text if available, otherwise use actual URL
  let displayUrl = '';
  if (answeringQuestionUrl && questionText) {
    // Display as: baseUrl/question/slugified-question-text
    const slug = questionText
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim();
    displayUrl = `${BASE_URL}/qna/question/${slug}`;
  } else {
    displayUrl = answeringQuestionUrl || (shareToken ? `${BASE_URL}/qna/share/${shareToken}` : '');
  }

  return (
    <Container fluid>
      <style>
        {`
          .url-field-no-select {
            user-select: none !important;
            -webkit-user-select: none !important;
            -moz-user-select: none !important;
            -ms-user-select: none !important;
          }
          .url-field-no-select::selection {
            background: transparent !important;
          }
          .url-field-no-select::-moz-selection {
            background: transparent !important;
          }
        `}
      </style>
      <div className="mb-3">
        <p style={{ marginBottom: "8px", fontSize: "clamp(13px, 2vw, 16px)" }}>
          <strong>URL to display answering question:</strong>
        </p>
        <Form.Control
          readOnly
          onClick={handleCopyUrl}
          onDoubleClick={handleCopyUrl}
          value={displayUrl}
          onSelect={(e) => e.preventDefault()}
          onSelectStart={(e) => e.preventDefault()}
          className="url-field-no-select"
          style={{
            backgroundColor: "#D9D9D9",
            border: "1px solid #ccc",
            color: "#FFFFF",
            cursor: "pointer",
            fontSize: "clamp(13px, 2vw, 16px)",
            fontWeight: "600",
            overflow: "hidden",
            textOverflow: "ellipsis",
            padding: "0px",
            paddingLeft: "4px",
            borderRadius: "2px",
            height: "28px",
            lineHeight: "28px",
            userSelect: "none",
            WebkitUserSelect: "none",
            MozUserSelect: "none",
            msUserSelect: "none"
          }}
        />
        
        {/* Legend */}
        <div className="d-flex align-items-center flex-wrap" style={{ gap: "16px", marginTop: "32px" }}>
          <div className="d-flex align-items-center">
            <div
              style={{
                width: "20px",
                height: "20px",
                border: "1px solid #ccc",
                marginRight: "8px",
                backgroundColor: "white",
                flexShrink: 0
              }}
            ></div>
            <span style={{ fontSize: "clamp(13px, 2vw, 16px)", whiteSpace: "nowrap" }}>Not Answered</span>
          </div>
          <div className="d-flex align-items-center">
            <div
              style={{
                width: "20px",
                height: "20px",
                backgroundColor: "#4E6688",
                marginRight: "8px",
                flexShrink: 0
              }}
            ></div>
            <span style={{ fontSize: "clamp(13px, 2vw, 16px)", whiteSpace: "nowrap" }}>Answered</span>
          </div>
          <div className="d-flex align-items-center">
            <div
              style={{
                width: "20px",
                height: "20px",
                backgroundColor: "#71C0BB",
                marginRight: "8px",
                flexShrink: 0
              }}
            ></div>
            <span style={{ fontSize: "clamp(13px, 2vw, 16px)", whiteSpace: "nowrap" }}>Answering</span>
          </div>
        </div>
      </div>
    </Container>
  );
};

export default UrlFieldAndLegend;

