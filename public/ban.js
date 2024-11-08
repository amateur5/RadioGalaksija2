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
async function login(username, password) {
    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-socket-id': socketId // Postavi socket ID kao header
            },
            body: JSON.stringify({ username, password })
        });

        const responseText = await response.text();
        console.log(responseText); // Prikazuje status prijave

        if (isAdmin()) {
            fetchIPList(); // Poziva funkciju koja učitava listu IP adresa ako je korisnik admin
        }
    } catch (error) {
        console.error('Greška prilikom logovanja:', error);
    }
}

// Funkcija za dobijanje liste IP adresa, samo za admina
async function fetchIPList() {
    try {
        const response = await fetch('/ip-list');
        if (!response.ok) {
            throw new Error('Greška sa serverom, pokušajte ponovo.');
        }

        const data = await response.json();
        const ipListContainer = document.getElementById('ip-list-container');
        ipListContainer.innerHTML = ''; // Očisti prethodni sadržaj

        data.forEach(guest => {
            const userDiv = document.createElement('div');
            userDiv.innerHTML = `${guest.guestIp} <button id="banButton_${guest.guestId}">Ban</button>`;
            ipListContainer.appendChild(userDiv);
            setupBanButton(guest.guestId); // Dodaje funkcionalnost za dugme za ban
        });
    } catch (error) {
        console.error('Greška prilikom preuzimanja IP adresa:', error);
    }
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

// Povezivanje sa serverom i provera IP adrese korisnika
io.on('connection', async (socket) => {
    const guestId = socket.id;
    const ip = socket.request.connection.remoteAddress;

    try {
        // Proveri da li `getLocation` postoji i pozovi je
        let location = null;
        if (ipModule && typeof ipModule.getLocation === 'function') {
            location = await ipModule.getLocation(ip);
        } else {
            console.error('ipModule.getLocation funkcija nije definisana');
        }

        const city = location ? location.city : "Nepoznato mesto";

        console.log(`Korisnik sa IP adresom ${ip} dolazi iz grada: ${city}`);
    } catch (error) {
        console.error('Greška prilikom preuzimanja IP adrese:', error);
    }
});
