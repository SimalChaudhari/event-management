import React from 'react';
import { Container, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { BASE_URL } from '../../../configs/env';

const UrlFieldAndLegend = ({ shareToken, answeringQuestionUrl }) => {
  const handleCopyUrl = () => {
    const fullUrl = answeringQuestionUrl || (shareToken ? `${BASE_URL}/qna/share/${shareToken}` : '');
    if (fullUrl) {
      navigator.clipboard.writeText(fullUrl).then(() => {
        toast.success('URL copied to clipboard!');
      }).catch(() => {
        toast.error('Failed to copy URL');
      });
    }
  };

  const displayUrl = answeringQuestionUrl || (shareToken ? `${BASE_URL}/qna/share/${shareToken}` : '');

  return (
    <Container fluid>
      <div className="mb-3">
        <p style={{ marginBottom: "8px", fontSize: "14px" }}>
          <strong>URL to display answering question:</strong>
        </p>
        <Form.Control
          readOnly
          onClick={handleCopyUrl}
          value={displayUrl}
          style={{
            backgroundColor: "#D9D9D9",
            border: "1px solid #ccc",
            color: "#FFFFF",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: "600",
            overflow: "hidden",
            textOverflow: "ellipsis",
            padding: "0px",
            paddingLeft: "4px",
            borderRadius: "2px",
            height: "20px",
            lineHeight: "20px"
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
            <span style={{ fontSize: "14px", whiteSpace: "nowrap" }}>Not Answered</span>
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
            <span style={{ fontSize: "14px", whiteSpace: "nowrap" }}>Answered</span>
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
            <span style={{ fontSize: "14px", whiteSpace: "nowrap" }}>Answering</span>
          </div>
        </div>
      </div>
    </Container>
  );
};

export default UrlFieldAndLegend;

