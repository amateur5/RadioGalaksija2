// Registracija korisnika
document.getElementById('registerForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Spreči podnošenje forme

    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;

    fetch('/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    })
    .then(response => {
        if (response.ok) {
            alert('Registracija uspešna');
            this.reset(); // Isprazni formu
        } else {
            alert('Greška pri registraciji');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Došlo je do greške. Pokušajte ponovo.');
    });
});

// Prijava korisnika
document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Spreči podnošenje forme

    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    })
    .then(response => {
        if (response.ok) {
            alert('Prijava uspešna');
            console.log(`Događaj za prijavu emitovan za korisnika: ${username}`);
            socket.emit('userLoggedIn', username); // Emituj događaj sa korisničkim imenom
            this.reset(); // Isprazni formu
        } else {
            alert('Nevažeći podaci za prijavu');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Došlo je do greške. Pokušajte ponovo.');
    });
});
