import React, { useRef, useState } from 'react';

function formatTime(totalSeconds) {
  const mins = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const secs = String(totalSeconds % 60).padStart(2, '0');
  return `${mins}:${secs}`;
}

export default function RecordScreen({ onSubmit, submitting }) {
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [status, setStatus] = useState('Ready to record...');

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioBlobRef = useRef(null);
  const timerRef = useRef(null);

  const startRecording = () => {
    if (isRecording) return;

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        const mediaRecorder = new MediaRecorder(stream);
        audioChunksRef.current = [];
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          audioBlobRef.current = audioBlob;
          setHasRecording(true);
          setStatus('✅ Recording saved! Press Play to listen or Submit to send.');
        };

        mediaRecorder.start();
        setIsRecording(true);
        setHasRecording(false);
        setStatus('🔴 Recording... Speak now!');

        setSeconds(0);
        clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          setSeconds((s) => s + 1);
        }, 1000);
      })
      .catch((error) => {
        console.error('Error accessing microphone:', error);
        setStatus('❌ Error: ' + error.message);
      });
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      clearInterval(timerRef.current);
      setStatus('⏹ Recording stopped. Press Play to review.');
    } else {
      setStatus('⚠️ No recording in progress.');
    }
  };

  const playRecording = () => {
    if (audioBlobRef.current) {
      const audioUrl = URL.createObjectURL(audioBlobRef.current);
      const audio = new Audio(audioUrl);
      audio.play();
      setStatus('▶️ Playing recording...');
      audio.onended = () => setStatus('⏹ Playback finished.');
    } else {
      setStatus('⚠️ No recording found. Please record something first.');
    }
  };

  const handleSubmit = () => {
    if (audioBlobRef.current) {
      setStatus('⏳ Submitting... Please wait.');
      onSubmit(audioBlobRef.current);
    } else {
      setStatus('⚠️ No recording found. Please record something first!');
    }
  };

  return (
    <div className="recording-section">
      <h2>Tell us about your health</h2>
      <p>Press record and speak.</p>

      <div className="controls">
        <button className="btn-start" onClick={startRecording} disabled={isRecording}>▶ Start Recording</button>
        <button className="btn-stop" onClick={stopRecording} disabled={!isRecording}>⏹ Stop</button>
        <button className="btn-play" onClick={playRecording} disabled={!hasRecording}>▶ Play</button>
        <button className="btn-submit" onClick={handleSubmit} disabled={!hasRecording || submitting}>📤 Submit</button>
      </div>

      <div className="timer">{formatTime(seconds)}</div>
      <div className="status">{status}</div>
    </div>
  );
}
