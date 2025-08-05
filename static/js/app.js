document.addEventListener('DOMContentLoaded', function () {
    const form = document.querySelector('form');
    if (!form) return;

    let answerDiv, confirmationDiv, tableDiv, followupForm, statusDiv, resetButton;

    checkSessionStatus();

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        
        // show loading state
        showLoading(true);
        
        const formData = new FormData(form);

        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            showLoading(false);
            if (data.answer) {
                showResults(data.answer, data.confirmation, data.table_html);
                showFollowupInput();
                showResetButton();
            } else {
                showError(data.confirmation || 'Error processing file');
            }
        })
        .catch(err => {
            showLoading(false);
            showError('Error uploading file. Please try again.');
            console.error(err);
        });
    });

    function showLoading(show) {
        const submitBtn = form.querySelector('button[type="submit"]');
        if (show) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Analyzing...';
        } else {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Analyze Spreadsheet';
        }
    }

    function showError(message) {
        if (!confirmationDiv) {
            confirmationDiv = document.createElement('div');
            confirmationDiv.className = 'confirmation mt-3';
            form.parentNode.appendChild(confirmationDiv);
        }
        confirmationDiv.className = 'confirmation alert alert-danger mt-3';
        confirmationDiv.innerHTML = message;
    }

    function checkSessionStatus() {
        fetch('/status')
        .then(response => response.json())
        .then(data => {
            if (data.has_data) {
                showSessionStatus(data.filename);
                showFollowupInput();
                showResetButton();
            }
        })
        .catch(err => console.log('No active session'));
    }

    function showSessionStatus(filename) {
        if (!statusDiv) {
            statusDiv = document.createElement('div');
            statusDiv.className = 'alert alert-info mt-3';
            form.parentNode.insertBefore(statusDiv, form.nextSibling);
        }
        statusDiv.innerHTML = `<strong>Active Session:</strong> Currently analyzing "${filename}". You can ask questions below or upload a new file.`;
    }

    function showResults(answer, confirmation, tableHtml) {
        // Answer display
        if (!answerDiv) {
            answerDiv = document.createElement('div');
            answerDiv.className = 'answer alert alert-info mt-3';
            form.parentNode.appendChild(answerDiv);
        }
        answerDiv.innerHTML = "<strong>Answer:</strong> " + (answer || 'No answer received.');

        // Confirmation display
        if (!confirmationDiv) {
            confirmationDiv = document.createElement('div');
            confirmationDiv.className = 'confirmation mt-3';
            form.parentNode.appendChild(confirmationDiv);
        }
        confirmationDiv.className = 'confirmation alert alert-success mt-3';
        confirmationDiv.innerHTML = confirmation || '';

        // Table preview display
        if (!tableDiv) {
            tableDiv = document.createElement('div');
            tableDiv.id = 'table-preview';
            tableDiv.className = 'mt-4';
            form.parentNode.appendChild(tableDiv);
        }
        if (tableHtml) {
            tableDiv.innerHTML = '<h5>Data Preview (First 10 rows):</h5>' + tableHtml;
        }
    }

    function showResetButton() {
        if (resetButton) return;

        resetButton = document.createElement('button');
        resetButton.className = 'btn btn-outline-secondary mt-2';
        resetButton.innerHTML = 'Upload New File';
        resetButton.onclick = function() {
            if (confirm('This will clear your current session. Are you sure?')) {
                fetch('/reset', { method: 'POST' })
                .then(() => {
                    location.reload();
                });
            }
        };

        if (followupForm) {
            followupForm.appendChild(resetButton);
        }
    }

    function showFollowupInput() {
        if (followupForm) return;

        followupForm = document.createElement('div');
        followupForm.className = 'followup-section mt-4 p-3 border rounded';
        followupForm.innerHTML = `
            <h5>Ask Follow-up Questions</h5>
            <form class="followup-form">
                <div class="input-group mb-2">
                    <input type="text" name="followup_question" class="form-control" placeholder="Ask another question about this data..." required>
                    <button type="submit" class="btn btn-primary">Ask</button>
                </div>
                <small class="text-muted">Examples: "What's the total revenue?", "Are there any errors?", "Show me the trends"</small>
            </form>
        `;

        form.parentNode.appendChild(followupForm);

        const followupFormElement = followupForm.querySelector('.followup-form');
        followupFormElement.addEventListener('submit', function (e) {
            e.preventDefault();
            const followupInput = followupForm.querySelector('input[name="followup_question"]');
            const submitBtn = followupForm.querySelector('button[type="submit"]');
            const question = followupInput.value;

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Thinking...';

            fetch('/ask', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ followup_question: question })
            })
            .then(response => response.json())
            .then(data => {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Ask';
                if (data.answer) {
                    showResults(data.answer, data.confirmation, null);
                    followupInput.value = '';
                } else {
                    showError(data.confirmation || 'Error processing question');
                }
            })
            .catch(err => {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Ask';
                showError('Error with follow-up question. Please try again.');
                console.error(err);
            });
        });
    }
});
