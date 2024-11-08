const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { connectDB, User } = require('./mongo');
const bcrypt = require('bcrypt');
require('dotenv').config();
const banmodule = require("./banmodule");
const ipModule = require('./ip'); // Modul koji vraća grad za IP adresu

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

connectDB();

let guests = {}; // Objekat sa gostima i njihovim IP adresama i gradovima
let assignedNumbers = new Set(); // Skup brojeva koji su već dodeljeni
let connectedIps = []; // Lista povezanih IP adresa

app.use(express.json());
app.use(express.static(__dirname + '/public'));

// Generiši jedinstveni broj za gosta
function generateUniqueNumber() {
    let number;
    do {
        number = Math.floor(Math.random() * 8889) + 1111;
    } while (assignedNumbers.has(number));
    assignedNumbers.add(number);
    return number;
}

// Upravljanje konekcijama
io.on('connection', async (socket) => {
    const ip = socket.request.connection.remoteAddress;

    // Preuzmi grad na osnovu IP adrese
    let location = await ipModule.getLocation(ip); // Pretpostavlja da ipModule vraća grad i državu
    const city = location ? location.city : "Nepoznato mesto";

    const uniqueNumber = generateUniqueNumber();
    const nickname = `Gost-${uniqueNumber}`;

    // Sačuvaj informacije o korisniku
    guests[socket.id] = { nickname, ip, city };
    console.log(`${nickname} iz ${city} se povezao.`);

    // Provera da li je gost banovan
    if (banmodule.isGuestBanned(socket.id)) {
        socket.disconnect();
        return;
    }

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
        io.emit('chatMessage', messageToSend);
    });

    // Banovanje gosta (samo od strane admina)
    socket.on("toggleBanUser", (targetGuestId) => {
        if (guests[socket.id].nickname === "Radio Galaksija") {
            banmodule.isGuestBanned(targetGuestId) ? 
                banmodule.unbanGuest(targetGuestId) : 
                banmodule.banGuest(targetGuestId);
            io.sockets.sockets.get(targetGuestId)?.disconnect();
            io.emit('updateGuestList', Object.values(guests).map(g => g.nickname));
        }
    });

    // Kada gost napusti čet
    socket.on('disconnect', () => {
        console.log(`${guests[socket.id].nickname} se odjavio.`);
        assignedNumbers.delete(parseInt(guests[socket.id].nickname.split('-')[1], 10));
        delete guests[socket.id];

        // Ukloni IP adresu gosta kada se odjavi
        connectedIps = connectedIps.filter((entry) => entry.ip !== ip);

        io.emit('updateGuestList', Object.values(guests).map(g => g.nickname));
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server je pokrenut na portu ${PORT}`);
});
