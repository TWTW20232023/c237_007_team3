# Reservation

## Feature Owner

Min

## Purpose

This feature is responsible for creating and managing book reservations.

Expected responsibilities include:
- Create reservation
- Reservation expiry logic
- Reservation status management

## Updated Feature Documentation

### 1. What routes have you created?
* `POST /reservations/book/:bookId` - Creates a new reservation record in the database for the logged-in user and temporarily locks the book's status[cite: 1, 2].
* `GET /reservations/my-reservations` - Renders the user's personal reservation tracking dashboard page[cite: 1, 2].

### 2. What pages (EJS files) have you created?
* `features/Reservation/views/my-reservations.ejs` - A clean, mobile-responsive user dashboard displaying a table of all the user's active, pending, or expired bookings[cite: 2].

### 3. What database tables or fields does your feature use?
This feature uses the **`reservations`** table with the following structure[cite: 1]:
* `id` (INT, Primary Key, Auto Increment)[cite: 1]
* `user_id` (INT, Foreign Key referencing the users table)[cite: 1]
* `book_id` (INT, Foreign Key referencing the books table)[cite: 1]
* `status` (ENUM: `'pending'`, `'confirmed'`, `'expired'`, `'overdue'`, Default: `'pending'`)[cite: 1]
* `reservation_date` (TIMESTAMP, Default: current time)[cite: 1]
* `expiry_date` (TIMESTAMP, set to current time + 14 days)[cite: 1]

### 4. How does your reservation flow work?
1. The user clicks a "Reserve" action trigger on a book listing page[cite: 1].
2. The backend confirms the book's status is currently `'available'`[cite: 1].
3. A new row is inserted into the `reservations` table with the status defaulted to `'pending'`, and an `expiry_date` mathematically set exactly 14 days into the future[cite: 1].
4. The book's status in the inventory table is automatically flipped to `'processing'` so it cannot be double-booked while awaiting administrative review[cite: 1].
5. The user is redirected to their "My Reservations" dashboard to view their updated list[cite: 1].

### 5. How should other teammates use your feature?
* **Ai Li (Book Listing):** On your catalog page, ensure the "Reserve" button targets a form or link pointing to `POST /reservations/book/<%= book.id %>`[cite: 1, 2]. This button should only display if the book's inventory status is `'available'`[cite: 1].
* **Tristan (Admin Approval):** When you build the admin dashboard, select records from the `reservations` table where the status is `'pending'`[cite: 1]. When you click "Approve", flip the reservation status to `'confirmed'` and the book's inventory status to `'reserved'`[cite: 1].
* **Hazirah (UI Integration):** You can link users directly to the tracking dashboard using the URL path `/reservations/my-reservations` in the navigation header bar[cite: 1, 2].

### 6. Are there any dependencies or things teammates should know before integrating with your feature?
* **Xylon's Auth Framework:** This module strictly requires the system middleware function `requireAuth` to guard the request pathways and relies explicitly on the user session object data layout (`req.session.userId`)[cite: 1, 2].
* **Cascading Deletions:** The `reservations` table uses `ON DELETE CASCADE` linked to the central book entries[cite: 1]. If an administrator completely purges a book from inventory, its associated historical reservation ledger logs will automatically clean themselves up from the database[cite: 1].

### 7. Any additional notes?
* The 14-day expiry calculation logic uses vanilla JavaScript date manipulation utilities directly within the controller layer to make deployment straightforward, lightweight, and easy to present during grading evaluations[cite: 1].