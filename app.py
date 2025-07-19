from flask import Flask, render_template, request, jsonify
import pandas as pd
from werkzeug.utils import secure_filename
from io import BytesIO
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'

@app.route('/')
def index():
    return render_template('index.html')

def allowed_filetype(filename):
    return filename.lower().endswith('.xls') or filename.lower().endswith('.xlsx')

@app.route('/upload', methods=["POST"])
def uploadForm():
    if 'excel_file' not in request.files or 'user_question' not in request.form:
        return jsonify({"confirmation": "Missing file or question.", "table_html": ""}), 400

    question = request.form.get('user_question')
    file = request.files['excel_file']

    if file.filename == '':
        return jsonify({"confirmation": "No file selected.", "table_html": ""}), 400
    if question == '':
        return jsonify({"confirmation": "No question given.", "table_html": ""}), 400
    if not allowed_filetype(file.filename):
        return jsonify({"confirmation": "Not an allowed filetype.", "table_html": ""}), 400

    filename = file.filename
    confirmation = f"File received: {filename}. Question received: {question}"

    table_html = None
    try:
        excel_bytes = file.read()
        excel_io = BytesIO(excel_bytes)
        df = pd.read_excel(excel_io)
        table_html = df.head().to_html(classes="table table-bordered table-sm", index=False)
    except Exception as e:
        table_html = f"<div class='alert alert-danger'>Error reading Excel file: {e}</div>"

    return jsonify({"confirmation": confirmation, "table_html": table_html})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

