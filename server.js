const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { connectDB, User } = require('./mongo');
const bcrypt = require('bcrypt');
require('dotenv').config();
const banmodule = require("./banmodule");
const ipModule = require('./ip');
const requestIp = require('request-ip');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

connectDB(); // Povezivanje sa bazom podataka
ipModule(app); // Middleware za beleženje IP adresa

let guests = {}; // Objekat sa gostima i njihovim IP adresama
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

    res.json({ success: true, role: user.role });
});

// Upravljanje konekcijama
io.on('connection', async (socket) => {
    const ip = requestIp.getClientIp(socket.request);
    let location = await ipModule.getLocation(ip);
    const city = location ? location.city : "Nepoznato mesto";
    const country = location ? location.country : "Nepoznata zemlja";

    const uniqueNumber = generateUniqueNumber();
    const nickname = `Gost-${uniqueNumber}`;

    guests[socket.id] = { nickname, ip, city, country };
    console.log(`${nickname} iz ${city}, ${country} se povezao.`);

    socket.broadcast.emit('newGuest', { nickname, city });
    io.emit('updateGuestList', Object.values(guests).map(g => g.nickname));

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

    socket.on('disconnect', () => {
        console.log(`${guests[socket.id].nickname} se odjavio.`);
        assignedNumbers.delete(parseInt(guests[socket.id].nickname.split('-')[1], 10));
        delete guests[socket.id];
        io.emit('updateGuestList', Object.values(guests).map(g => g.nickname));
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server je pokrenut na portu ${PORT}`);
});
