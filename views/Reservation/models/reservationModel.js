// NOTE:
// This version matches a reservations table with:
// id, user_id, book_id, status,
// reservation_date, expiry_date
//
// status enum:
// pending, confirmed, expired, overdue

const db = require('../../../config/db');

// Testing only (change to 14 days before submission)
const RESERVATION_PERIOD_MINUTES = 3;


function runHousekeeping(callback) {
  db.connection.query(
    `UPDATE reservations
     SET status='expired'
     WHERE status='pending' AND expiry_date < NOW()`,
    (err) => {
      if (err) return callback(err);

      db.connection.query(
        `UPDATE books
         SET status='available'
         WHERE status='processing'
         AND id IN (
           SELECT book_id FROM (
             SELECT book_id FROM reservations WHERE status='expired'
           ) x
         )`,
        (err2) => {
          if (err2) return callback(err2);

          db.connection.query(
            `UPDATE reservations
             SET status='overdue'
             WHERE status='confirmed' AND expiry_date < NOW()`,
            (err3) => {
              if (err3) return callback(err3);

              db.connection.query(
                `UPDATE books
                 SET status='available'
                 WHERE id IN (
                   SELECT book_id FROM (
                     SELECT book_id
                     FROM reservations
                     WHERE status='overdue'
                   ) x
                 )`,
                callback
              );
            }
          );
        }
      );
    }
  );
}

// Run housekeeping every 30 seconds
setInterval(() => {
  runHousekeeping((err) => {
    if (err) {
      console.error("Housekeeping error:", err);
    } else {
      console.log("Housekeeping completed:", new Date());
    }
  });
}, 30000);

function createReservation(userId, bookId, callback) {

  // Clean up expired reservations before allowing a new one
  runHousekeeping((err) => {

    if (err) return callback(err);

    db.connection.query(
      "SELECT status FROM books WHERE id = ?",
      [bookId],
      (err, rows) => {

        if (err) return callback(err);

        if (!rows.length) {
          return callback(null, { notFound: true });
        }

        if (rows[0].status !== "available") {
          return callback(null, { notAvailable: true });
        }

        db.connection.query(
          `INSERT INTO reservations
          (user_id, book_id, status, reservation_date, expiry_date)
          VALUES (?, ?, 'pending', NOW(), DATE_ADD(NOW(), INTERVAL ? MINUTE))`,
          [userId, bookId, RESERVATION_PERIOD_MINUTES],
          (err2, result) => {

            if (err2) return callback(err2);

            db.connection.query(
              "UPDATE books SET status='processing' WHERE id = ?",
              [bookId],
              (err3) => {

                if (err3) return callback(err3);

                callback(null, {
                  success: true,
                  reservationId: result.insertId
                });

              }
            );

          }
        );

      }
    );

  });

}

function getReservationById(id, cb){
  db.connection.query("SELECT * FROM reservations WHERE id=?", [id], cb);
}

function getReservationsForUser(userId, cb){
  runHousekeeping(err=>{
    if(err) return cb(err);
    db.connection.query(
      `SELECT
        r.id,
        r.status,
        r.reservation_date,
        r.expiry_date,
        b.title,
        b.author
      FROM reservations r
      JOIN books b ON b.id=r.book_id
      WHERE r.user_id=?
      ORDER BY r.reservation_date DESC`,
      [userId],
      cb
    );
  });
}

function getAllReservations(cb){
  runHousekeeping(err=>{
    if(err) return cb(err);
    db.connection.query(
      `SELECT
        r.id AS reservationId,
        r.status,
        r.reservation_date AS reservationDate,
        r.expiry_date AS expiryDate,
        b.id AS bookId,
        b.title AS bookTitle,
        u.username
      FROM reservations r
      JOIN books b ON b.id=r.book_id
      JOIN users u ON u.user_id=r.user_id
      ORDER BY r.reservation_date DESC`,
      cb
    );
  });
}

function getPendingReservations(cb){
  runHousekeeping(err=>{
    if(err) return cb(err);
    db.connection.query(
      `SELECT
        r.id AS reservationId,
        r.status,
        r.reservation_date AS reservationDate,
        r.expiry_date AS expiryDate,
        b.id AS bookId,
        b.title AS bookTitle,
        u.username
      FROM reservations r
      JOIN books b ON b.id=r.book_id
      JOIN users u ON u.user_id=r.user_id
      WHERE r.status='pending'
      ORDER BY r.reservation_date ASC`,
      cb
    );
  });
}

function getOverdueReservations(cb){
  runHousekeeping(err=>{
    if(err) return cb(err);
    db.connection.query(
      `SELECT
        r.id AS reservationId,
        r.status,
        r.reservation_date AS reservationDate,
        r.expiry_date AS expiryDate,
        b.id AS bookId,
        b.title AS bookTitle,
        u.username
      FROM reservations r
      JOIN books b ON b.id=r.book_id
      JOIN users u ON u.user_id=r.user_id
      WHERE r.status='overdue'
      ORDER BY r.expiry_date ASC`,
      cb
    );
  });
}

function approveReservation(id, cb){
  db.connection.query(
    "UPDATE reservations SET status='confirmed' WHERE id=? AND status='pending'",
    [id],
    err=>{
      if(err) return cb(err);
      db.connection.query(
        `UPDATE books
         SET status='reserved'
         WHERE id=(
           SELECT book_id FROM (
             SELECT book_id FROM reservations WHERE id=?
           ) t
         )`,
        [id],
        cb
      );
    }
  );
}

// Since your enum has NO 'rejected', delete the pending reservation instead.
function rejectReservation(id, cb){
  db.connection.query(
    "SELECT book_id FROM reservations WHERE id=?",
    [id],
    (err,rows)=>{
      if(err) return cb(err);
      if(!rows.length) return cb(null,{notFound:true});

      const bookId=rows[0].book_id;

      db.connection.query(
        "DELETE FROM reservations WHERE id=?",
        [id],
        err2=>{
          if(err2) return cb(err2);

          db.connection.query(
            "UPDATE books SET status='available' WHERE id=?",
            [bookId],
            cb
          );
        }
      );
    }
  );
}

function deleteReservation(id, cb){
  db.connection.query(
    "SELECT book_id,status FROM reservations WHERE id=?",
    [id],
    (err,rows)=>{
      if(err) return cb(err);
      if(!rows.length) return cb(null,{notFound:true});

      const r=rows[0];

      db.connection.query(
        "DELETE FROM reservations WHERE id=?",
        [id],
        err2=>{
          if(err2) return cb(err2);

          if(['pending','confirmed','overdue'].includes(r.status)){
            return db.connection.query(
              "UPDATE books SET status='available' WHERE id=?",
              [r.book_id],
              cb
            );
          }

          cb(null,{success:true});
        }
      );
    }
  );
}

module.exports={
//change back to RESERVATION_PERIOD_DAYS before submission
  RESERVATION_PERIOD_MINUTES,
  runHousekeeping,
  createReservation,
  getReservationById,
  getReservationsForUser,
  getAllReservations,
  getPendingReservations,
  getOverdueReservations,
  approveReservation,
  rejectReservation,
  deleteReservation
};
