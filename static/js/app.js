document.addEventListener('DOMContentLoaded', function () {
    const form = document.querySelector('form');
    if (!form) return;

    let answerDiv, confirmationDiv, tableDiv, followupForm;

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        const formData = new FormData(form);

        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            showResults(data.answer, data.confirmation, data.table_html);
            showFollowupInput(); // Enable follow-up questions
        })
        .catch(err => {
            alert('Error uploading file.');
            console.error(err);
        });
    });

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
            confirmationDiv.className = 'confirmation alert alert-success mt-3';
            form.parentNode.appendChild(confirmationDiv);
        }
        confirmationDiv.innerHTML = confirmation || '';

        // Table preview display
        if (!tableDiv) {
            tableDiv = document.createElement('div');
            tableDiv.id = 'table-preview';
            form.parentNode.appendChild(tableDiv);
        }
        tableDiv.innerHTML = tableHtml || '';
    }

    function showFollowupInput() {
        if (followupForm) return;

        followupForm = document.createElement('form');
        followupForm.className = 'followup-form mt-4';
        followupForm.innerHTML = `
            <input type="text" name="followup_question" placeholder="Ask another question..." required style="padding: 10px; width: 100%; border: 1px solid #ccc; border-radius: 8px; margin-bottom: 10px;">
            <button type="submit" style="padding: 10px 16px; background-color: #005580; color: white; border: none; border-radius: 8px; font-weight: 600;">Ask</button>
        `;

        form.parentNode.appendChild(followupForm);

        followupForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const followupInput = followupForm.querySelector('input[name="followup_question"]');
            const question = followupInput.value;

            fetch('/ask', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ followup_question: question })
            })
            .then(response => response.json())
            .then(data => {
                showResults(data.answer, data.confirmation, null);
                followupInput.value = '';
            })
            .catch(err => {
                alert('Error with follow-up question.');
                console.error(err);
            });
        });
    }
});
