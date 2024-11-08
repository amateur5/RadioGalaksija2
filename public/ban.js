let socketId = null;

// Provera povezivanja na server
socket.on('connect', () => {
    console.log("Klijent je povezan na server sa socket ID:", socket.id);
    socketId = socket.id; // Čuvamo socket ID za kasniju upotrebu
});

// Kada korisnik uspešno prijavi (događaj 'userLoggedIn' sa servera)
socket.on('userLoggedIn', ({ username, role }) => {
    console.log(`Događaj za prijavu primljen za korisnika: ${username} sa rola: ${role}`);
    sessionStorage.setItem('userRole', role); // Postavljanje u sessionStorage
    console.log("Postavljen userRole u sessionStorage:", role);
});

// Funkcija za proveru da li je korisnik admin
function isAdmin() {
    const userRole = sessionStorage.getItem('userRole');
    console.log("User role from sessionStorage:", userRole);
    return userRole === 'admin';
}

// Funkcija za slanje login zahteva sa socket ID-om u header-u
function login(username, password) {
    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-socket-id': socketId // Postavi socket ID kao header
        },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.text())
    .then(responseText => {
        console.log(responseText); // Prikazuje status prijave
        if (isAdmin()) {
            fetchIPList(); // Poziva funkciju koja učitava listu IP adresa ako je korisnik admin
        }
    })
    .catch(error => console.error('Greška prilikom logovanja:', error));
}

// Funkcija za dobijanje liste IP adresa, samo za admina
function fetchIPList() {
    fetch('/ip-list')
        .then(response => {
            if (!response.ok) {
                throw new Error('Greška sa serverom, pokušajte ponovo.');
            }
            return response.json();
        })
        .then(data => {
            const ipListContainer = document.getElementById('ip-list-container');
            ipListContainer.innerHTML = ''; // Očisti prethodni sadržaj
            data.forEach(guest => {
                const userDiv = document.createElement('div');
                userDiv.innerHTML = `${guest.guestIp} <button id="banButton_${guest.guestId}">Ban</button>`;
                ipListContainer.appendChild(userDiv);
                setupBanButton(guest.guestId); // Dodaje funkcionalnost za dugme za ban
            });
        })
        .catch(error => console.error('Greška prilikom preuzimanja IP adresa:', error));
}

// Funkcija za povezivanje ban dugmeta
function setupBanButton(guestId) {
    const banButton = document.getElementById(`banButton_${guestId}`);
    if (banButton) {
        banButton.ondblclick = () => {
            socket.emit("toggleBanUser", guestId);
        };
    }
}
