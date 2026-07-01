from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import uuid
import json
from datetime import datetime
import threading
import time
from dotenv import load_dotenv

load_dotenv()

from azure.storage.queue import QueueClient

app = Flask(__name__)
CORS(app)

# ==================== AZURE QUEUE CONFIG ====================

AZURE_STORAGE_CONNECTION_STRING = os.getenv('AZURE_STORAGE_CONNECTION_STRING')
QUEUE_NAME = os.getenv('AZURE_QUEUE_NAME', 'voice-processing-queue')

queue = None
if AZURE_STORAGE_CONNECTION_STRING:
    try:
        queue = QueueClient.from_connection_string(
            AZURE_STORAGE_CONNECTION_STRING,
            QUEUE_NAME
        )
        print(f"✅ Azure Queue client initialized: {QUEUE_NAME}")
    except Exception as e:
        print(f"❌ Failed to initialize Azure Queue: {str(e)}")
else:
    print("⚠️ AZURE_STORAGE_CONNECTION_STRING not set, skipping Azure Queue init")

# ==================== LOCAL CONFIG ====================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
GENERATED_PDF_FOLDER = os.path.join(BASE_DIR, 'generated_pdfs')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(GENERATED_PDF_FOLDER, exist_ok=True)

# In-memory storage for submissions
submissions = {}

def process_audio(submission_id, audio_path, language):
    """Simulate processing audio in the background"""
    try:
        print(f"⏳ Processing submission {submission_id}...")
        time.sleep(3)
        submissions[submission_id]['status'] = 'processing'
        submissions[submission_id]['progress'] = 50
        time.sleep(2)

        pdf_path = os.path.join(GENERATED_PDF_FOLDER, f"{submission_id}.txt")
        with open(pdf_path, 'w') as f:
            f.write(f"Submission ID: {submission_id}\n")
            f.write(f"Language: {language}\n")
            f.write(f"Created: {datetime.now()}\n")
            f.write("\n--- Transcription ---\n")
            f.write("Mock transcription of your audio.\n")

        submissions[submission_id]['status'] = 'ready'
        submissions[submission_id]['progress'] = 100
        submissions[submission_id]['downloadUrl'] = f"/download/{submission_id}"
        print(f"✅ Submission {submission_id} complete!")
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        submissions[submission_id]['status'] = 'error'
        submissions[submission_id]['error'] = str(e)

@app.route("/api/submit", methods=["POST"])
def submit_audio():
    print("📥 Received submission request")
    try:
        submission_id = str(uuid.uuid4())
        language = request.form.get('language', 'en-US')
        audio_file = request.files.get('audio')

        if not audio_file:
            return jsonify({"error": "No audio file"}), 400

        filename = f"{submission_id}.wav"
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        audio_file.save(filepath)

        submissions[submission_id] = {
            "submissionId": submission_id,
            "status": "accepted",
            "audioPath": filepath,
            "language": language,
            "createdAt": datetime.now().isoformat(),
            "progress": 0
        }

        # ==================== SEND TO AZURE QUEUE ====================
        if queue:
            try:
                message = {
                    "submissionId": submission_id,
                    "language": language,
                    "audioPath": filepath,
                    "timestamp": datetime.now().isoformat()
                }

                queue.send_message(json.dumps(message))
                print(f"✅ Message sent to Azure Queue: {submission_id}")
            except Exception as queue_error:
                print(f"⚠️ Warning: Could not send to Azure Queue: {str(queue_error)}")
        else:
            print("⚠️ Queue not initialized, skipping Azure Queue send")

        # Start background processing
        thread = threading.Thread(target=process_audio, args=(submission_id, filepath, language))
        thread.start()

        return jsonify({"status": "accepted", "submissionId": submission_id}), 202
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/status/<submission_id>")
def check_status(submission_id):
    try:
        if submission_id not in submissions:
            return jsonify({"error": "Not found"}), 404
        sub = submissions[submission_id]
        response = {
            "submissionId": submission_id,
            "status": sub.get('status', 'unknown'),
            "progress": sub.get('progress', 0),
            "createdAt": sub.get('createdAt'),
            "language": sub.get('language')
        }
        if sub.get('status') == 'ready':
            response["downloadUrl"] = sub.get('downloadUrl')
        return jsonify(response), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/download/<submission_id>")
def download_pdf(submission_id):
    try:
        pdf_path = os.path.join(GENERATED_PDF_FOLDER, f"{submission_id}.txt")
        if not os.path.exists(pdf_path):
            return jsonify({"error": "File not found"}), 404
        return send_file(pdf_path, as_attachment=True, download_name=f"submission_{submission_id}.txt")
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/submissions", methods=["GET"])
def list_submissions():
    return jsonify({"submissions": list(submissions.values())}), 200

@app.route("/.auth/logout")
def logout():
    return jsonify({"message": "Logged out", "redirect": "/"}), 200

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5001))
    print(f"🚀 Starting server on http://localhost:{port}")
    app.run(debug=True, host="0.0.0.0", port=port)
