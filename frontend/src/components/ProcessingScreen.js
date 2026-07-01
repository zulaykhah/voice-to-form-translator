import React from 'react';

export default function ProcessingScreen({ statusText }) {
  return (
    <div className="processing">
      <h2>⏳ Processing your form...</h2>
      <p>Please do not close the app.</p>
      <p>{statusText}</p>
    </div>
  );
}
