const virtualGuests = [
    { nickname: 'Cuceklika 1', messages: ['Poz Svima', 'jasaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'],
 color: 'deepskyblue' },
    { nickname: 'Cuceklika 2', messages: ['Zdravo Sarinenge', 'opaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'], color: 'purple' },

    { nickname: 'Cuceklika 3', messages: ['Selami sarinenge', 'tooOOOOOOOOOOOOOOOOOOOOOOO'], color: 'red' },



    { nickname: 'Cuceklika 1', messages: ['*__X__* Mangava tu ❤️'], color: 'deepskyblue' },

    { nickname: 'Cuceklika 2', messages: ['Nas olestar cuceklike 1, Merava tuke *__X__* ❤️💋'], color: 'purple' },

    { nickname: 'Cuceklika 3', messages: ['Dzabe tumen cupinen pe taro bala OV TANO SAMO MLO'], color: 'red' },
];

function sendMessageToChat(guest, message) {
    const messageArea = document.getElementById('messageArea');

    const messageElement = document.createElement('div');
    messageElement.innerHTML = `<span style="color: ${guest.color}; font-weight: bold; font-style: italic;">${guest.nickname}: ${message}</span>`;
    
    // Dodavanje poruke na vrh
    messageArea.insertBefore(messageElement, messageArea.firstChild);
    
    // Dodavanje razmaka između poruka
    const spacingElement = document.createElement('div');
    spacingElement.style.height = '10px'; // Podešavanje visine razmaka
    messageArea.insertBefore(spacingElement, messageArea.firstChild.nextSibling); // Razmak nakon poruke

    messageArea.scrollTop = 0; // Skrolovanje na vrh
}

function addGuestToList(guest) {
    const guestList = document.getElementById('guestList');
    
    // Proveri da li gost već postoji u listi
    if (!Array.from(guestList.children).some(el => el.textContent === guest.nickname)) {
        const guestElement = document.createElement('div');
        guestElement.classList.add('guest');
        guestElement.textContent = guest.nickname;
        guestElement.style.color = guest.color; // Postavljanje boje za gosta

        guestList.appendChild(guestElement);
    }
}

function startVirtualGuests() {
    const messageTimings = [
        { guestIndex: 0, messageIndex: 0, time: 0 },    // cuceklika 1: Poz Svima
        { guestIndex: 0, messageIndex: 1, time: 5 },    // cuceklika 1: jasaaaaaaaaaaaaaaaaa
        { guestIndex: 1, messageIndex: 0, time: 60 },   // cuceklika 2: tooooooooooooooooooooo
        { guestIndex: 1, messageIndex: 1, time: 65 },   // cuceklika 2: opaaaaaaaaaaaaaaaaaaa
        { guestIndex: 2, messageIndex: 0, time: 120 },  // cuceklika 3: jasaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
        { guestIndex: 2, messageIndex: 1, time: 125 },  // cuceklika 3: saaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
        { guestIndex: 0, messageIndex: 0, time: 180 },  // cuceklika 1: *__X__* Mangava tu ❤️
        { guestIndex: 1, messageIndex: 1, time: 200 },  // cuceklika 2: Nas olestar cuceklike 1...
        { guestIndex: 2, messageIndex: 1, time: 220 },  // cuceklika 3: Dzabe tumen cupinen...
    ];

    messageTimings.forEach(({ guestIndex, messageIndex, time }) => {
        setTimeout(() => {
            sendMessageToChat(virtualGuests[guestIndex], virtualGuests[guestIndex].messages[messageIndex]);
            addGuestToList(virtualGuests[guestIndex]); // Dodavanje gosta u listu
        }, time * 1000); // Konvertovanje sekundi u milisekunde
    });

    // Pauza od 240 sekundi pre ponovnog ciklusa
    setTimeout(startVirtualGuests, 240 * 1000);
}

// Pokretanje virtuelnih gostiju kada se stranica učita
window.onload = startVirtualGuests;