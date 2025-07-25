from flask import Flask, render_template, request, jsonify, session
import pandas as pd
from werkzeug.utils import secure_filename
from io import BytesIO
import os
import json
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv("FLASK_SECRET_KEY", "supersecret")

# Configure Gemini API
api_key = os.getenv("GEMINI_API_KEY")
print("Using Gemini API key:", api_key)
genai.configure(api_key=api_key)
model = genai.GenerativeModel("gemini-1.5-flash")

@app.route('/')
def index():
    return render_template('index.html')

def allowed_filetype(filename):
    return filename.lower().endswith('.xls') or filename.lower().endswith('.xlsx')

@app.route('/upload', methods=["POST"])
def uploadForm():
    if 'excel_file' not in request.files or 'user_question' not in request.form:
        return jsonify({"confirmation": "Missing file or question.", "table_html": "", "answer": ""}), 400

    question = request.form.get('user_question')
    file = request.files['excel_file']

    if file.filename == '':
        return jsonify({"confirmation": "No file selected.", "table_html": "", "answer": ""}), 400
    if question == '':
        return jsonify({"confirmation": "No question given.", "table_html": "", "answer": ""}), 400
    if not allowed_filetype(file.filename):
        return jsonify({"confirmation": "Not an allowed filetype.", "table_html": "", "answer": ""}), 400

    confirmation = f"File received: {file.filename}. Question received: {question}"

    try:
        # Read Excel data
        excel_bytes = file.read()
        excel_io = BytesIO(excel_bytes)
        df = pd.read_excel(excel_io)
        table_html = df.head().to_html(classes="table table-bordered table-sm", index=False)

        # Store CSV data in session for reuse
        csv_data = df.to_csv(index=False)
        session['csv_data'] = csv_data  # Save for follow-up questions

        # Send prompt to Gemini
        prompt = f"""You are a helpful assistant that answers questions based on CSV tabular data.

Data:
{csv_data}

Question:
{question}

Answer:"""

        print("Prompt sent to Gemini:\n", prompt)
        response = model.generate_content(prompt)
        answer = response.text.strip()
        print("Response from Gemini:\n", answer)

    except Exception as e:
        print("Error during processing:", e)
        return jsonify({
            "confirmation": f"Error: {e}",
            "table_html": "",
            "answer": ""
        }), 500

    return jsonify({
        "confirmation": confirmation,
        "table_html": table_html,
        "answer": answer
    })

@app.route('/ask', methods=["POST"])
def followUpQuestion():
    if 'csv_data' not in session:
        return jsonify({"confirmation": "No dataset uploaded yet. Please upload an Excel file first.", "answer": ""}), 400

    question = request.json.get("followup_question", "").strip()
    if not question:
        return jsonify({"confirmation": "No follow-up question provided.", "answer": ""}), 400

    csv_data = session['csv_data']

    prompt = f"""You are a helpful assistant that answers questions based on CSV tabular data.

Data:
{csv_data}

Question:
{question}

Answer:"""

    print("Follow-up prompt sent to Gemini:\n", prompt)
    try:
        response = model.generate_content(prompt)
        answer = response.text.strip()
        print("Follow-up response:\n", answer)
    except Exception as e:
        print("Error during follow-up:", e)
        return jsonify({"confirmation": f"Error: {e}", "answer": ""}), 500

    return jsonify({"confirmation": "Answer generated.", "answer": answer})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8000)
