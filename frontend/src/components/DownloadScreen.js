import React from 'react';

export default function DownloadScreen({ downloadUrl, onStartOver }) {
  return (
    <div className="download-section">
      <h2>Your form is ready!</h2>
      <p>Your completed health form is ready to download.</p>
      <a href={downloadUrl} target="_blank" rel="noreferrer">
        <button className="btn-download">Download PDF</button>
      </a>
      <button className="btn-done" onClick={onStartOver}>Done</button>
    </div>
  );
}
