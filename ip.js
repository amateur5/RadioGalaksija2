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
