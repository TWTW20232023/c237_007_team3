-- PROPOSED - reservations table for the Reservation feature (Min's ownership).
-- Written here because My Reservations (UIIntegration) can't be tested
-- without it, but please review with Min before treating this as final -
-- especially the status values and the 14-day expiry logic, which are his
-- feature's job to define, not mine.

CREATE TABLE IF NOT EXISTS reservations (
    reservation_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    book_id INT NOT NULL,

    -- pending   -> just created, waiting on an admin
    -- confirmed -> admin approved it
    -- expired   -> 14 days passed with no approval
    status ENUM('pending', 'confirmed', 'expired') DEFAULT 'pending',

    reserved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,

    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,

    INDEX idx_user (user_id),
    INDEX idx_status (status)
); 
