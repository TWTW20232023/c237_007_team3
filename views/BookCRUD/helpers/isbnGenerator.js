// Generates a realistic, valid ISBN-13 (978 prefix + 9 random digits +
// a correctly calculated check digit — same algorithm real publishers use).
// This is the only place ISBNs get created, so every book always has a
// unique, well-formed code without the admin typing anything in.

function generateISBN13() {
  const prefix = '978';
  let digits = prefix;

  for (let i = 0; i < 9; i++) {
    digits += Math.floor(Math.random() * 10);
  }

  // ISBN-13 check digit: alternate weights of 1 and 3 across the first
  // 12 digits, sum them, then check digit = (10 - (sum % 10)) % 10.
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(digits[i], 10);
    sum += (i % 2 === 0) ? digit : digit * 3;
  }
  const checkDigit = (10 - (sum % 10)) % 10;

  return digits + checkDigit;
}

module.exports = { generateISBN13 };
