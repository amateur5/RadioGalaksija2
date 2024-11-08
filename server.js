const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { connectDB, User } = require('./mongo');
const bcrypt = require('bcrypt');
require('dotenv').config();
const banmodule = require("./banmodule");
const ipModule = require('./ip'); // Pretpostavljamo da ovaj modul vraća grad za IP adresu

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

connectDB();

let guests = {}; // Objekat sa gostima i njihovim ID-ovima
let assignedNumbers = new Set(); // Skup brojeva koji su već dodeljeni
let connectedIps = []; // Lista povezanih IP adresa

app.use(express.json());
app.use(express.static(__dirname + '/public'));

// Funkcija za registraciju korisnika
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).send('Username and password are required.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });

    try {
        await user.save();
        res.status(201).send('User registered');
    } catch (err) {
        console.error('Greška prilikom registracije:', err);
        res.status(400).send('Error registering user');
    }
});

// Funkcija za logovanje korisnika
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).send('Username and password are required.');
    }

    try {
        const user = await User.findOne({ username });
        if (user && await bcrypt.compare(password, user.password)) {
            const role = user.role;
            res.send(role === 'admin' ? 'Logged in as admin' : 'Logged in as guest');
        } else {
            res.status(400).send('Invalid credentials');
        }
    } catch (err) {
        console.error('Greška prilikom logovanja:', err);
        res.status(500).send('Server error');
    }
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Generiši jedinstveni broj za gosta
function generateUniqueNumber() {
    let number;
    do {
        number = Math.floor(Math.random() * 8889) + 1111;
    } while (assignedNumbers.has(number));
    assignedNumbers.add(number);
    return number;
}

// Endpoint za listu IP adresa
app.get('/ip-list', (req, res) => {
    res.json(connectedIps);
});

// Upravljanje konekcijama
io.on('connection', async (socket) => {
    const guestId = socket.id;
    const ip = socket.request.connection.remoteAddress;

    // Preuzmi grad na osnovu IP adrese
    let location = await ipModule.getLocation(ip); // Pretpostavlja da ipModule vraća grad i državu
    const city = location ? location.city : "Nepoznato mesto";

    // Dodaj IP adresu u spisak povezanih ako već nije uključena
    if (!connectedIps.some(entry => entry.ip === ip)) {
        connectedIps.push({ ip, city });
    }

    const uniqueNumber = generateUniqueNumber();
    const nickname = `Gost-${uniqueNumber}`;

    guests[guestId] = nickname;
    console.log(`${nickname} iz ${city} se povezao.`);

    // Provera da li je gost banovan
    if (banmodule.isGuestBanned(guestId)) {
        socket.disconnect();
        return;
    }

    socket.broadcast.emit('newGuest', nickname);
    io.emit('updateGuestList', Object.values(guests));

    // Prijem poruka u četu
    socket.on('chatMessage', (msgData) => {
        const time = new Date().toLocaleTimeString();
        const messageToSend = {
            text: msgData.text,
            bold: msgData.bold,
            italic: msgData.italic,
            color: msgData.color,
            nickname: guests[guestId],
            time: time
        };
        io.emit('chatMessage', messageToSend);
    });

    // Banovanje gosta (samo od strane admina)
    socket.on("toggleBanUser", (targetGuestId) => {
        if (guests[guestId] === "Radio Galaksija") {
            banmodule.isGuestBanned(targetGuestId) ? 
                banmodule.unbanGuest(targetGuestId) : 
                banmodule.banGuest(targetGuestId);
            io.sockets.sockets.get(targetGuestId)?.disconnect();
            io.emit('updateGuestList', Object.values(guests));
        }
    });

    // Kada gost napusti čet
    socket.on('disconnect', () => {
        console.log(`${guests[guestId]} se odjavio.`);
        assignedNumbers.delete(parseInt(guests[guestId].split('-')[1], 10));
        delete guests[guestId];

        // Ukloni IP adresu gosta kada se odjavi
        connectedIps = connectedIps.filter((entry) => entry.ip !== ip);

        io.emit('updateGuestList', Object.values(guests));
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server je pokrenut na portu ${PORT}`);
});
