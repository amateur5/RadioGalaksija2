const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { connectDB, User } = require('./mongo');
const bcrypt = require('bcrypt');
require('dotenv').config();
const banModule = require("./banModule");
const ipModule = require('./ip');
const requestIp = require('request-ip'); // Dodato za prepoznavanje IP adrese klijenta

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Povezivanje sa bazom podataka
connectDB();

// Middleware za beleženje IP adresa
ipModule(app);

let guests = {}; // Objekat sa gostima i njihovim detaljima (nickname, ip, city, country, color)
let assignedNumbers = new Set(); // Skup dodeljenih brojeva
let connectedIps = []; // Spisak povezanih IP adresa

app.use(express.json());
app.use(express.static(__dirname + '/public'));

// Generisanje jedinstvenog broja za gosta
function generateUniqueNumber() {
    let number;
    do {
        number = Math.floor(Math.random() * 8889) + 1111;
    } while (assignedNumbers.has(number));
    assignedNumbers.add(number);
    return number;
}

// Provera da li je korisnik admin
function checkAdmin(username) {
    return username === 'Radio Galaksija';
}

// Funkcija za registraciju korisnika
app.post('/register', async (req, res) => {
    const { username, password, role } = req.body;

    if (!username || !password) {
        return res.status(400).send('Korisničko ime i lozinka su obavezni!');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword, role });

    try {
        await newUser.save();
        res.status(201).send('Korisnik registrovan');
    } catch (error) {
        console.error(error);
        res.status(500).send('Greška pri registraciji');
    }
});

// Prijava korisnika (preuzeto iz manje verzije zbog jednostavnosti)
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    const user = await User.findOne({ username });
    if (!user) {
        return res.status(400).send('Korisnik ne postoji');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(400).send('Pogrešna lozinka');
    }

    // Vraćamo role korisnika kako bi se znalo da li je admin ili gost
    res.json({ success: true, role: user.role });
});

// Prikazivanje stranice
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Upravljanje događajima prilikom konekcije gostiju
io.on('connection', async (socket) => {
    const ip = requestIp.getClientIp(socket.request);
    let location = await ipModule.getLocation(ip);
    const city = location ? location.city : "Nepoznato mesto";
    const country = location ? location.country : "Nepoznata zemlja";

    const uniqueNumber = generateUniqueNumber();
    const nickname = `Gost-${uniqueNumber}`;

    // Čuvamo sve potrebne informacije o gostima
    guests[socket.id] = { nickname, ip, city, country, color: "#FFFFFF" };
    console.log(`${nickname} iz ${city}, ${country} se povezao.`);

    // Emitovanje novog gosta svim korisnicima
    socket.broadcast.emit('newGuest', { nickname, city });
    io.emit('updateGuestList', Object.values(guests).map(g => ({ nickname: g.nickname, color: g.color })));

    // Kada korisnik pošalje poruku u četu
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

        // Proveravamo da li je korisnik admin za posebnu oznaku
        if (checkAdmin(guests[socket.id].nickname)) {
            messageToSend.isAdmin = true;
        }

        io.emit('chatMessage', messageToSend);
    });

    // Kada gost promeni boju
    socket.on('changeColor', (color) => {
        guests[socket.id].color = color; // Ažuriramo boju
        io.emit('updateGuestList', Object.values(guests).map(g => ({ nickname: g.nickname, color: g.color })));
    });

    // Banovanje gosta samo od strane admina "Radio Galaksija"
    socket.on("toggleBanUser", (targetGuestId) => {
        if (guests[socket.id].nickname === "Radio Galaksija") {
            banModule.isGuestBanned(targetGuestId) ? 
                banModule.unbanGuest(targetGuestId) : 
                banModule.banGuest(targetGuestId);
            io.sockets.sockets.get(targetGuestId)?.disconnect();
            io.emit('updateGuestList', Object.values(guests).map(g => ({ nickname: g.nickname, color: g.color })));
        }
    });

    // Kada se gost diskonektuje
    socket.on('disconnect', () => {
        console.log(`${guests[socket.id].nickname} se odjavio.`);
        assignedNumbers.delete(parseInt(guests[socket.id].nickname.split('-')[1], 10));
        delete guests[socket.id];
        io.emit('updateGuestList', Object.values(guests).map(g => ({ nickname: g.nickname, color: g.color })));
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server je pokrenut na portu ${PORT}`);
});
