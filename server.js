const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { connectDB, User } = require('./mongo');
const bcrypt = require('bcrypt');
require('dotenv').config();
const banmodule = require("./banmodule");
const ipModule = require('./ip'); // Novi IP modul koji smo ažurirali
const requestIp = require('request-ip'); // Dodaj ovo za uzimanje IP adresa

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

connectDB(); // Povezivanje s bazom podataka

// Pokrećemo `ipModule` da koristi middleware za beleženje IP adresa
ipModule(app);

let guests = {}; // Objekat sa gostima i njihovim IP adresama i gradovima
let assignedNumbers = new Set(); // Skup brojeva koji su već dodeljeni

app.use(express.json());
app.use(express.static(__dirname + '/public'));

// Funkcija za generisanje jedinstvenog broja za gosta
function generateUniqueNumber() {
    let number;
    do {
        number = Math.floor(Math.random() * 8889) + 1111; // Brojevi između 1111 i 9999
    } while (assignedNumbers.has(number)); // Ako broj već postoji, generišemo novi
    assignedNumbers.add(number); // Dodajemo broj u skup kako bismo izbegli duplikate
    return number;
}

// Upravljanje konekcijama
io.on('connection', async (socket) => {
    // Dobavljanje IP adrese korisnika pomoću request-ip
    const ip = requestIp.getClientIp(socket.request); // Koristi request-ip za preuzimanje IP adrese

    // Dobavljanje podataka o lokaciji na osnovu IP adrese
    let location = await ipModule.getLocation(ip); // Pozivamo `getLocation` iz ipModule
    const city = location ? location.city : "Nepoznato mesto";
    const country = location ? location.country : "Nepoznata zemlja";

    // Generiši jedinstveni nadimak za gosta
    const uniqueNumber = generateUniqueNumber();
    const nickname = `Gost-${uniqueNumber}`;

    // Sačuvaj informacije o korisniku
    guests[socket.id] = { nickname, ip, city, country };
    console.log(`${nickname} iz ${city}, ${country} se povezao.`);

    // Emitovanje liste gostiju
    socket.broadcast.emit('newGuest', { nickname, city });
    io.emit('updateGuestList', Object.values(guests).map(g => g.nickname));

    // Prijem poruka u četu
    socket.on('chatMessage', (msgData) => {
        const time = new Date().toLocaleTimeString();
        const messageToSend = {
            text: msgData.text,
            bold: msgData.bold,
            italic: msgData.italic,
            color: msgData.color,
            nickname: guests[socket.id].nickname,
            time: time
        };
        io.emit('chatMessage', messageToSend); // Šaljemo poruku svim korisnicima
    });

    // Kada gost napusti čet
    socket.on('disconnect', () => {
        console.log(`${guests[socket.id].nickname} se odjavio.`);
        assignedNumbers.delete(parseInt(guests[socket.id].nickname.split('-')[1], 10)); // Uklanjamo dodeljeni broj
        delete guests[socket.id]; // Brišemo gosta iz objekta
        io.emit('updateGuestList', Object.values(guests).map(g => g.nickname)); // Ažuriramo listu gostiju
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server je pokrenut na portu ${PORT}`);
});
