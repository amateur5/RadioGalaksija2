const bannedGuests = {};

function banGuest(guestId) {
    console.log(`Pozvana funkcija banGuest sa ID:${guestId}`); // Dodan log za praćenje poziva
    if (!isGuestBanned(guestId)) {
        bannedGuests[guestId] = true;
        console.log(`Gospodin/Guest sa ID:${guestId} je banovan.`);
    } else {
        console.log(`Gospodin/Guest sa ID:${guestId} je već banovan.`);
    }
}

function unbanGuest(guestId) {
    console.log(`Pozvana funkcija unbanGuest sa ID:${guestId}`); // Dodan log za praćenje poziva
    if (isGuestBanned(guestId)) {
        delete bannedGuests[guestId];
        console.log(`Gospodin/Guest sa ID:${guestId} je odbanovan.`);
    } else {
        console.log(`Gospodin/Guest sa ID:${guestId} nije banovan.`);
    }
}

function isGuestBanned(guestId) {
    console.log(`Provera da li je gost sa ID:${guestId} banovan.`);
    return !!bannedGuests[guestId];
}

function getBannedGuests() {
    console.log('Dobijanje liste banovanih gostiju:', bannedGuests);
    return Object.keys(bannedGuests); // Vraća listu banovanih ID-ova
}

module.exports = { 
    banGuest, 
    unbanGuest, 
    isGuestBanned,
    getBannedGuests // Sada možeš dobiti listu banovanih gostiju
};
