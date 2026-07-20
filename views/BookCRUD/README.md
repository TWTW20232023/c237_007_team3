# Book CRUD

## Feature Owner

Syafiq

## Purpose

This feature is responsible for managing books from the administrator's perspective.

Responsibilities:
- Add book
- Edit book
- Delete book
- Update book availability status
- (Enhancement) QR code lookup per book — see below

## 1. What routes have you created?

All mounted at `/books` in app.js via `features/BookCRUD/routes/bookRoutes.js`:

| Method | Route | Access | Purpose |
|---|---|---|---|
| GET | /books | Admin only | List all books |
| GET | /books/add | Admin only | Show add book form |
| POST | /books/add | Admin only | Create a new book |
| GET | /books/edit/:id | Admin only | Show edit book form |
| POST | /books/edit/:id | Admin only | Update a book |
| POST | /books/delete/:id | Admin only | Delete a book |
| POST | /books/toggle/:id | Admin only | Toggle available/reserved |
| GET | /books/view/:id | **Public — no login required** | QR code lookup page |

## 2. What pages (EJS files) have you created?

All in `features/BookCRUD/views/`:
- `list.ejs` — admin book table with edit/toggle/delete actions
- `add.ejs` — add book form (title, author, genre — ISBN is auto-generated)
- `edit.ejs` — edit book form, shows the auto-generated ISBN (read-only) and a QR code
- `public-view.ejs` — public-facing lookup page (reached by scanning a book's QR code)
- `public-not-found.ejs` — shown if a scanned/visited book ID doesn't exist

## 3. What database tables or fields does your feature use?

Table: `books`
- `id` (PK, auto-increment)
- `title`, `author`, `genre` — entered by admin
- `isbn` — **auto-generated server-side** (valid ISBN-13 with real check digit), never typed in
- `status` — `available` / `reserved`, toggled manually or (later) by Min's Reservation feature
- `created_at`

Schema is in `database/schema.sql`.

## 4. How should other teammates use your feature?

- **Min (Reservation):** when a reservation is approved, you'll want to set the matching book's `status` to `reserved`. You can either call `Book.updateStatus(id, 'reserved', callback)` by requiring `features/BookCRUD/models/bookModel.js`, or just run the UPDATE directly — up to you, happy to discuss.
- **Ai Li (BookListing):** you're reading the same `books` table for display/search/filter — no functions needed from me, just query it directly. We're not sharing route files, just the table.
- **Tristan (AdminDashboard):** the "Delete Books" responsibility overlaps with mine (`deleteBook`) — worth a quick chat on whether your dashboard calls into my model function or has its own route. Currently `Book.deleteBook(id, callback)` in `bookModel.js` is reusable.

## 5. Dependencies / things to know before integrating

- Routes expect `requireAuth` from `middleware/auth.js` and `requireAdmin` from `middleware/admin.js` (root-level, Xylon's Authentication feature) — both currently placeholders, not built yet. My routes reference these exact names/paths, so please keep them consistent once merged.
- Added `qrcode` as a new dependency (`npm install qrcode` after pulling this branch).
- `config/db.js` is currently an empty placeholder — my feature won't actually connect to a real database until that's filled in. I have a tested, working version (Azure MySQL, `.env`-based config) ready to share if nobody's claimed this file yet — flagging in team chat separately.
- No shared `views/partials/navbar.ejs` / `footer.ejs` exist yet (Hazirah's UIIntegration), so my pages currently use a **temporary inline navbar/footer** placeholder marked clearly in the code (`<!-- TEMP: replace once Hazirah's UIIntegration merges -->`). Easy find-and-replace once that's ready.

## 6. Additional notes

- ISBN generation: real ISBN-13 format (978 prefix + 9 random digits + calculated check digit), in `helpers/isbnGenerator.js`.
- QR enhancement: `GET /books/view/:id` is deliberately NOT behind admin auth — it's meant for a patron scanning a physical book's QR code to see basic info without logging in. Only safe public fields are exposed (title/author/genre/status).
