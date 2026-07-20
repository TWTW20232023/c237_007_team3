-- PROPOSED - reviews table for the Reviews feature.
-- Since you confirmed this table doesn't exist in the live database yet,
-- this is safe to run fresh (no ALTER TABLE / migration needed).

CREATE TABLE IF NOT EXISTS reviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    book_id INT NOT NULL,

    rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,

    -- NO LONGER USED for gating visibility - reviews now show
    -- immediately on submission, no admin approval step. Column left in
    -- place since your live table already has it and it's harmless to
    -- leave unused - safe to DROP COLUMN status later if you want to
    -- clean it up, but not required for anything to work.
    status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,

    INDEX idx_book (book_id),
    INDEX idx_status (status)
);
