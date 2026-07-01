const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

export async function submitRecording(audioBlob, language) {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.wav');
  formData.append('language', language);

  const response = await fetch(`${API_URL}/api/submit`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to submit recording');
  }

  return response.json();
}

export async function getStatus(submissionId) {
  const response = await fetch(`${API_URL}/api/status/${submissionId}`);
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to fetch status');
  }
  return response.json();
}

export function downloadUrlFor(path) {
  return `${API_URL}${path}`;
}
