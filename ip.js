const axios = require('axios');

let connectedIps = []; // Ovdje čuvamo sve povezane IP adrese

module.exports = (app) => {
    // Middleware za praćenje svih povezanih IP adresa
    app.use((req, res, next) => {
        // Prvo proveravamo zaglavlje `x-forwarded-for`, a ako nije prisutno, koristimo `req.connection.remoteAddress`
        const ip = req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0] : req.connection.remoteAddress;
        
        // Uklanjamo IPv6 prefiks ako je prisutan (za lokalne testove, ::ffff:127.0.0.1)
        const formattedIp = ip.includes(':') ? ip.split(':').pop() : ip;

        // Dodajemo IP samo ako nije već u listi
        if (!connectedIps.includes(formattedIp)) {
            connectedIps.push(formattedIp);
        }
        next();
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
        const response = await axios.get(`https://ipapi.co/${ip}/json/`);
        const data = response.data;

        // Proveravamo da li su podaci validni
        if (data.error) {
            console.error('Greška u geolokaciji: ', data.error);
            return { city: "Nepoznato mesto", country: "Nepoznata zemlja" }; // Default vrednosti
        }

        // Vraćamo podatke o lokaciji (grad, zemlja itd.)
        return {
            city: data.city || "Nepoznato mesto",
            country: data.country_name || "Nepoznata zemlja"
        };
    } catch (error) {
        console.error('Greška prilikom dobijanja lokacije:', error);
        return { city: "Nepoznato mesto", country: "Nepoznata zemlja" }; // Default vrednosti u slučaju greške
    }
}

module.exports.getLocation = getLocation;  // Exportujemo funkciju za geolokaciju
