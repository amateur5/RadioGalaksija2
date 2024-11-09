const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { connectDB, User } = require('./mongo');
const bcrypt = require('bcrypt');
require('dotenv').config();
const banmodule = require("./banmodule");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

connectDB(); // Povezivanje sa bazom podataka

let guests = {}; // Objekat sa gostima
let assignedNumbers = new Set(); // Skup dodeljenih brojeva

app.use(express.json());
app.use(express.static(__dirname + '/public'));

// Funkcija za generisanje jedinstvenog broja za gosta
function generateUniqueNumber() {
    let number;
    do {
        number = Math.floor(Math.random() * 8889) + 1111;
    } while (assignedNumbers.has(number)); 
    assignedNumbers.add(number);
    return number;
}

// Middleware za autentifikaciju admina
function checkAdmin(username) {
    return username === 'Radio Galaksija';
}

// Registracija korisnika
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

// Prijava korisnika
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

    res.json({ success: true, role: user.role, username: user.username });
});

// Upravljanje konekcijama
io.on('connection', (socket) => {
    const uniqueNumber = generateUniqueNumber();
    const nickname = `Gost-${uniqueNumber}`;

    guests[socket.id] = { nickname, color: "#FFFFFF", loggedIn: false }; // Dodajemo početnu boju i flag za login
    console.log(`${nickname} se povezao.`);

    socket.broadcast.emit('newGuest', { nickname });
    io.emit('updateGuestList', Object.values(guests).map(g => ({ nickname: g.nickname, color: g.color })));

    socket.on('login', (username) => {
        // Kada se korisnik uloguje, ažuriramo njegov nickname u listi
        if (guests[socket.id]) {
            guests[socket.id].nickname = username;
            guests[socket.id].loggedIn = true;
            console.log(`${username} se ulogovao.`);
        }

        io.emit('updateGuestList', Object.values(guests).map(g => ({ nickname: g.nickname, color: g.color })));
    });

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

        if (checkAdmin(guests[socket.id].nickname)) {
            messageToSend.isAdmin = true;
        }

        io.emit('chatMessage', messageToSend);
    });

    // Odlazak gosta sa četa
    socket.on('disconnect', () => {
        console.log(`${guests[guestId]} se odjavio.`);
        assignedNumbers.delete(parseInt(guests[guestId].split('-')[1], 10));
        delete guests[guestId];

});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server je pokrenut na portu ${PORT}`);
});
