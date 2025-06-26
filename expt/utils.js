function logData(data) {
    fetch('/api/log', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        })
    .then(response => response.text())
    .then(data => console.log(data))
    .catch(error => console.error('Error logging action:', error));
}