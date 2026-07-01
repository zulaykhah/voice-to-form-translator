import React, { useEffect, useRef, useState } from 'react';
import './App.css';
import LanguageScreen from './components/LanguageScreen';
import RecordScreen from './components/RecordScreen';
import ProcessingScreen from './components/ProcessingScreen';
import DownloadScreen from './components/DownloadScreen';
import { submitRecording, getStatus, downloadUrlFor } from './api';

const STATUS_MESSAGES = {
  accepted: 'Recording received...',
  processing: 'Transcribing your recording...',
  ready: 'Your form is ready!',
  error: 'Something went wrong processing your recording.',
};

function App() {
  const [screen, setScreen] = useState('language');
  const [language, setLanguage] = useState('en-US');
  const [submissionId, setSubmissionId] = useState(null);
  const [processingStatus, setProcessingStatus] = useState(STATUS_MESSAGES.accepted);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const pollRef = useRef(null);

  const handleSubmit = async (audioBlob) => {
    setSubmitting(true);
    setError(null);
    try {
      const data = await submitRecording(audioBlob, language);
      setSubmissionId(data.submissionId);
      setProcessingStatus(STATUS_MESSAGES.accepted);
      setScreen('processing');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (screen !== 'processing' || !submissionId) return undefined;

    pollRef.current = setInterval(async () => {
      try {
        const data = await getStatus(submissionId);
        setProcessingStatus(STATUS_MESSAGES[data.status] || data.status);

        if (data.status === 'ready') {
          clearInterval(pollRef.current);
          setDownloadUrl(downloadUrlFor(data.downloadUrl));
          setScreen('download');
        } else if (data.status === 'error') {
          clearInterval(pollRef.current);
          setError('Processing failed. Please try again.');
          setScreen('record');
        }
      } catch (err) {
        clearInterval(pollRef.current);
        setError(err.message);
        setScreen('record');
      }
    }, 2000);

    return () => clearInterval(pollRef.current);
  }, [screen, submissionId]);

  const startOver = () => {
    setSubmissionId(null);
    setDownloadUrl(null);
    setError(null);
    setScreen('language');
  };

  return (
    <div className="container">
      <h1>🎤 Voice to Form Translator</h1>
      <p className="subtitle">Convert your voice to form data instantly</p>

      {error && <div className="error-banner">{error}</div>}

      {screen === 'language' && (
        <LanguageScreen
          language={language}
          onLanguageChange={setLanguage}
          onContinue={() => setScreen('record')}
        />
      )}

      {screen === 'record' && (
        <RecordScreen onSubmit={handleSubmit} submitting={submitting} />
      )}

      {screen === 'processing' && (
        <ProcessingScreen statusText={processingStatus} />
      )}

      {screen === 'download' && (
        <DownloadScreen downloadUrl={downloadUrl} onStartOver={startOver} />
      )}
    </div>
  );
}

export default App;
