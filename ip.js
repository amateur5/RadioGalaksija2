// ip.js
let connectedIps = []; // Ovdje čuvamo sve povezane IP adrese

module.exports = (app) => {
    // Middleware za praćenje svih povezanih IP adresa
    app.use((req, res, next) => {
        const ip = req.ip;  // Uzimamo IP adresu korisnika
        if (!connectedIps.includes(ip)) {
            connectedIps.push(ip); // Dodajemo novu IP adresu ako nije već tu
        }
        next(); // Nastavljamo sa sledećom funkcijom u lancu
    });

    // Endpoint za dobijanje liste svih povezanih IP adresa
    app.get('/ip-list', (req, res) => {
        res.json(connectedIps);  // Šaljemo listu svih povezanih IP adresa na front-end
    });
};

// Funkcija za dobijanje lokacije na osnovu IP adrese
async function getLocation(ip) {
    try {
        // Koristimo API za geolokaciju IP adrese, na primer ipapi.co
        const response = await fetch(`https://ipapi.co/${ip}/json/`);
        const data = await response.json();
        return data; // Vraćamo podatke o lokaciji (uključujući grad, zemlju itd.)
    } catch (error) {
        console.error('Greška prilikom dobijanja lokacije:', error);
        return null; // Vraćamo null ako dođe do greške
    }
}

module.exports.getLocation = getLocation;  // Exportujemo funkciju za geolokaciju
