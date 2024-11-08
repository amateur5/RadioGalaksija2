const socket = io();

let isBold = false;
let isItalic = false;
let currentColor = '#808080';  // Podrazumevana boja je siva (#808080)

// Provera da li postoji 'boldBtn' i dodavanje event listenera
const boldBtn = document.getElementById('boldBtn');
if (boldBtn) {
    boldBtn.addEventListener('click', function() {
        isBold = !isBold;
        updateInputStyle();
    });
}

// Provera da li postoji 'italicBtn' i dodavanje event listenera
const italicBtn = document.getElementById('italicBtn');
if (italicBtn) {
    italicBtn.addEventListener('click', function() {
        isItalic = !isItalic;
        updateInputStyle();
    });
}

// Kada korisnik odabere boju
const colorBtn = document.getElementById('colorBtn');
const colorPicker = document.getElementById('colorPicker');
if (colorBtn) {
    colorBtn.addEventListener('click', function() {
        if (colorPicker) colorPicker.click();
    });
}

if (colorPicker) {
    colorPicker.addEventListener('input', function() {
        currentColor = this.value;
        updateGuestColor(currentColor);  // Menja boju za gosta
        updateInputStyle();  // Ažurira stil teksta
    });
}

// Ažurira stilove u polju za unos
function updateInputStyle() {
    const inputField = document.getElementById('chatInput');
    if (inputField) {
        inputField.style.fontWeight = isBold ? 'bold' : 'normal';
        inputField.style.fontStyle = isItalic ? 'italic' : 'normal';
        inputField.style.color = currentColor;
    }
}

// Funkcija za ažuriranje boje imena gosta
function updateGuestColor(color) {
    const guestName = document.getElementById('guestNickname');  // Primer za 'guestNickname'
    if (guestName) {
        guestName.style.color = color;
        socket.emit('guestColorChange', { nickname: guestName.textContent, color: color });
    }
}

// Kada server pošalje novu boju za gosta
socket.on('updateGuestColor', function(data) {
    const guestElements = document.querySelectorAll('.guest');
    guestElements.forEach((guest) => {
        if (guest.textContent === data.nickname) {
            guest.style.color = data.color;
        }
    });
});

// Slanje poruke kada korisnik pritisne Enter
const chatInput = document.getElementById('chatInput');
if (chatInput) {
    chatInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            let message = this.value;
            socket.emit('chatMessage', {
                text: message,
                bold: isBold,
                italic: isItalic,
                color: currentColor,
                nickname: "Guest"  // Preimenovano u 'Guest'
            });
            this.value = ''; // Isprazni polje za unos
        }
    });
}

// Prikazivanje primljenih poruka
socket.on('chatMessage', function(data) {
    const messageArea = document.getElementById('messageArea');
    if (messageArea) {
        const newMessage = document.createElement('div');
        newMessage.classList.add('message');
        newMessage.style.fontWeight = data.bold ? 'bold' : 'normal';
        newMessage.style.fontStyle = data.italic ? 'italic' : 'normal';
        newMessage.style.color = data.color;
        newMessage.innerHTML = `<strong>${data.nickname}:</strong> ${data.text}`;
        messageArea.prepend(newMessage);
    }
});

// Dodavanje novih gostiju na listu sa početnom sivom bojom
socket.on('newGuest', function (nickname) {
    const guestList = document.getElementById('guestList');
    if (guestList) {
        const newGuest = document.createElement('div');
        newGuest.className = 'guest';
        newGuest.textContent = nickname;
        newGuest.style.color = '#808080';  // Početna boja je siva
        guestList.appendChild(newGuest);
    }
});

// Ažuriranje liste gostiju
socket.on('updateGuestList', function (guests) {
    const guestList = document.getElementById('guestList');
    if (guestList) {
        guestList.innerHTML = ''; // Očisti trenutnu listu
        guests.forEach(guest => {
            const newGuest = document.createElement('div');
            newGuest.className = 'guest';
            newGuest.textContent = guest.nickname;
            newGuest.style.color = guest.color || '#808080'; // Ako postoji boja, primeni je, inače podrazumevana boja
            guestList.appendChild(newGuest);
        });
    }
});
