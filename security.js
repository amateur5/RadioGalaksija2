// security.js - Modul za sigurnost i banovanje gostiju

let guests = []; // Lista gostiju

// Funkcija za dodavanje gosta u listu
function addGuest(socket, guestId) {
  guests.push({
    id: guestId,
    socket: socket,
    banned: false,
    nickname: `Gost ${guestId}`, // Dodajemo nadimak za gosta
  });
}

// Funkcija za banovanje gosta
function banGuest(guestId) {
  const target = guests.find(g => g.id === guestId);
  if (target) {
    target.banned = true;
    target.socket.emit('message', 'Vi ste banovani! Ne možete više pisati.');
    target.socket.disconnect();  // Odspajanje gosta
    return `Gost ${guestId} je banovan.`;
  } else {
    return `Gost sa ID-em ${guestId} nije pronađen.`;
  }
}

// Funkcija koja će reagovati na komande administracije
function handleAdminCommand(command, guestId) {
  if (command.toLowerCase().startsWith("ban za gost")) {
    const targetId = parseInt(command.split(' ')[3]); // Ekstraktuj gostov ID
    return banGuest(targetId);
  } else {
    return "Nepoznata komanda.";
  }
}

// Izvoz funkcija
module.exports = { addGuest, banGuest, handleAdminCommand, guests };
