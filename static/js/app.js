document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('form');
    if (!form) return;

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(form);
        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            const confirmationDiv = document.querySelector('.confirmation') || document.createElement('div');
            confirmationDiv.className = 'confirmation alert alert-success mt-3';
            confirmationDiv.innerHTML = data.confirmation || '';
            if (!document.querySelector('.confirmation')) {
                form.parentNode.appendChild(confirmationDiv);
            }

            let tableDiv = document.querySelector('#table-preview');
            if (!tableDiv) {
                tableDiv = document.createElement('div');
                tableDiv.id = 'table-preview';
                form.parentNode.appendChild(tableDiv);
            }
            tableDiv.innerHTML = data.table_html || '';
        })
        .catch(err => {
            alert('Error uploading file.');
        });
    });
});
