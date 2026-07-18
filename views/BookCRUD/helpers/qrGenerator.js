const QRCode = require('qrcode');

// Generates a QR code (as a base64 data URL) that encodes a real,
// scannable link to a book's public lookup page — not just the raw
// ISBN. Scanning it takes you to /books/view/:id, which shows the
// book's info without needing to log in.
async function generateBookQRCode(lookupUrl) {
  const dataUrl = await QRCode.toDataURL(lookupUrl);
  return dataUrl;
}

module.exports = { generateBookQRCode };
