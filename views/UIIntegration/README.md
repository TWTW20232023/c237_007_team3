# UI Integration

## Feature Owner

Hazirah

## Status: rebuilt against current conventions (previous version was lost when the repo got restructured)

## What's built

- `views/partials/head.ejs`, `navbar.ejs`, `footer.ejs` (project root) - shared layout, reads the real flat session fields (`req.session.user_id`/`username`/`role` via `res.locals.loggedIn`/`username`/`role`, bridged in `app.js`)
- `views/UIIntegration/views/home.ejs` - real landing page at `/` (replaced the old placeholder text response)
- `views/UIIntegration/views/my-reservations.ejs` - a logged-in user's own reservations with status
- `views/UIIntegration/controllers/uiController.js`, `models/reservationModel.js`, `routes/uiRoutes.js` - callback-style, matching `bookController.js`/`bookModel.js`'s actual pattern (not promises)

## Dependency: proposed `reservations` table

`database/reservationSchema.sql` - **not yet reviewed with Min**, whose feature actually owns this table. Written now because My Reservations can't be tested without *some* schema to query against. Please confirm column names/status values with him before treating this as final.

## Still open

- **Dashboard** - not built yet, deciding on scope first (reservation stat cards + expiry warnings + quick links, most likely)
- `/catalog` (Ai Li's future public book listing) - navbar already links to it, will 404 until her `BookListing` feature exists - expected, not a bug
