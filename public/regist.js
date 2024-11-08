// Registracija korisnika
document.getElementById('registerForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Spreči podnošenje forme

    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;
    const role = (username === 'Radio Galaksija') ? 'admin' : 'guest'; // Automatski dodeljujemo ulogu admina ako je korisničko ime 'Radio Galaksija'

    fetch('/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password, role }) // Poslali smo i ulogu na server
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
    .then(response => response.json()) // Pretpostavljamo da server vraća JSON sa informacijama
    .then(data => {
        if (data.success) {
            alert('Prijava uspešna');
            const role = data.role; // Pretpostavljamo da server vraća ulogu
            console.log(`Ulogovan kao: ${role}`);

            // Emitovanje događaja sa korisničkim imenom i ulogom
            socket.emit('userLoggedIn', { username, role });

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
