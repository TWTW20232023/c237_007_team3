const mysql = require('mysql2/promise');

// Direct database connection configuration using your specific team credentials
const dbConfig = {
    host: 'c237-asyraf-mysql.mysql.database.azure.com', 
    user: 'c237_007', 
    password: 'c237007@2026!', 
    database: 'c237_007_team3' 
};

exports.createReservation = async (req, res) => {
    const bookId = req.params.bookId;
    const userId = req.session.userId; // Provided via Xylon's session handling

    // Expiry logic: Current Date + 14 Days (2 weeks)
    const reservationDate = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(reservationDate.getDate() + 14);

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);

        // 1. Check if the book is available
        const [books] = await connection.query('SELECT status FROM books WHERE id = ?', [bookId]);
        
        if (!books || books.length === 0) {
            return res.status(404).send('Book not found.');
        }
        
        if (books[0].status !== 'available') {
            return res.status(400).send('This book is not available for reservation.');
        }

        // 2. Insert into reservations table with 'pending' status
        const insertQuery = `
            INSERT INTO reservations (user_id, book_id, status, reservation_date, expiry_date) 
            VALUES (?, ?, 'pending', ?, ?)
        `;
        await connection.query(insertQuery, [userId, bookId, reservationDate, expiryDate]);

        // 3. Temporarily switch book status to 'processing' while awaiting Tristan's Admin Approval
        await connection.query('UPDATE books SET status = ? WHERE id = ?', ['processing', bookId]);

        res.redirect('/reservations/my-reservations');
    } catch (err) {
        console.error(err);
        res.status(500).send('Database error while making a reservation.');
    } finally {
        if (connection) await connection.end();
    }
};

exports.getMyReservations = async (req, res) => {
    const userId = req.session.userId;

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);

        // Fetch personal tracking records joined with relevant inventory metadata
        const query = `
            SELECT r.id, r.status, r.reservation_date, r.expiry_date, b.title, b.author 
            FROM reservations r
            JOIN books b ON r.book_id = b.id
            WHERE r.user_id = ?
            ORDER BY r.reservation_date DESC
        `;
        const [reservations] = await connection.query(query, [userId]);

        res.render('features/Reservation/views/my-reservations', { 
            reservations: reservations,
            user: req.session.user || null 
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Database error while fetching reservation dashboard.');
    } finally {
        if (connection) await connection.end();
    }
};