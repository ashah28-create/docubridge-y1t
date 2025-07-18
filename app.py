from flask import Flask, render_template, request, jsonify
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'

@app.route('/')
def index():
    return render_template('index.html')

def allowed_filetype(filename):
    return '.xls' in filename or '.xlsx' in filename

@app.route('/upload', methods=["POST"])
def uploadForm():

    if 'excel_file' not in request.files or 'question' not in request.form:
        return jsonify({"error":"Missing file or question"}), 400

    question = request.form.get('question')
    file = request.files['excel_file']

    if file.filename == '':
        return jsonify({"error":"No Selected File"}), 400
    
    if question == '':
        return jsonify({"error":"No Question Given"}), 400
    
    if not allowed_filetype(file.filename):
        return jsonify({'error':'Not an allowed filetype'}), 400
    

    print("File Received" + file.filename)
    print("Question Received" + question)

    return jsonify({
        "message":"Success",
        "File Received" : file.filename,
        "Question Received" : question
    }) 

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

