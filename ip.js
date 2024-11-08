// ip.js
let connectedIps = []; // Ovdje čuvamo sve povezane IP adrese

module.exports = (app) => {
    app.use((req, res, next) => {
        const ip = req.ip;
        if (!connectedIps.includes(ip)) {
            connectedIps.push(ip); // Dodajemo novu IP adresu ako nije već tu
        }
        next();
    });

    app.get('/ip-list', (req, res) => {
        // Šaljemo sve IP adrese na front-end
        res.json(connectedIps);
    });
};
// Primer ip.js fajla sa getLocation funkcijom
async function getLocation(ip) {
    // Ovaj kod koristi neki servis za dobijanje geografske lokacije po IP adresi.
    // Na primer, API poput ipapi.co, ipinfo.io, ili sličan.
    const response = await fetch(`https://ipapi.co/${ip}/json/`);
    const data = await response.json();
    return data; // Ovo bi trebalo da uključi `city` i druge podatke
}

module.exports = { getLocation };
