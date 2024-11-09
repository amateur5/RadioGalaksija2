const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { connectDB, User } = require('./mongo');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Povezivanje sa bazom podataka
connectDB();

let guests = {}; // Objekat sa gostima i njihovim nadimcima
let assignedNumbers = new Set(); // Skup dodeljenih brojeva

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

// Funkcija za proveru da li je korisnik admin
function checkAdmin(username) {
    return username === 'Radio Galaksija'; // Ovde možeš podesiti ime za admina
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

// Prikazivanje stranice
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Upravljanje događajima prilikom konekcije gostiju
io.on('connection', (socket) => {
    const uniqueNumber = generateUniqueNumber();
    const nickname = `Gost-${uniqueNumber}`;

    // Dodavanje gosta sa osnovnim informacijama
    guests[socket.id] = { nickname };
    console.log(`${nickname} se povezao.`);

    // Emitovanje novog gosta svim korisnicima
    io.emit('updateGuestList', Object.values(guests).map(g => ({ nickname: g.nickname })));

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

    // Kada se gost diskonektuje
    socket.on('disconnect', () => {
        console.log(`${guests[socket.id].nickname} se odjavio.`);
        assignedNumbers.delete(parseInt(guests[socket.id].nickname.split('-')[1], 10));
        delete guests[socket.id];
        io.emit('updateGuestList', Object.values(guests).map(g => ({ nickname: g.nickname })));
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server je pokrenut na portu ${PORT}`);
});
