# Authentication

## Feature Owner

Xylon

## Purpose

This feature is responsible for user authentication and authorization.

Expected responsibilities include:
- User registration
- User login
- User logout
- Password hashing (bcrypt)
- Session management
- User roles (Admin / User)

### Please Update This README

As development progresses, please keep this README updated.

Questions to answer:

1. What routes have you created?

   - `GET /auth/signup`:    Show sign-up form
   - `POST /auth/signup`:   Handle new user registration (hashes password with bcryptjs)
   - `GET /auth/login`:     Show login form
   - `POST /auth/login`:    Authenticate user against DB and start session
   - `GET /auth/logout`:    Destroy the current session
   - `GET /auth/dashboard`: Admin-only dashboard (protected by Auth + Admin Middleware)

2. What pages (EJS files) have you created?

   - `views/signup.ejs` (Sign-up form template)
   - `views/login.ejs` (Login form template)
   - `views/dashboard.ejs` (Admin Dashboard page template)

3. What middleware have you created?

   - `authMiddleware.js`: Protects routes that require a logged-in user. Redirects unauthenticated users back to `/auth/login`.
   - `adminMiddleware.js`: Protects admin-only routes. Returns 403 Forbidden if the user is not an admin (`role !== 'admin'`).

4. How should other teammates use your feature?

   To mount these routes in your main application, include the following:
javascript
const authRoutes = require('./features/Authentication/routes/authRoutes');

app.use('/auth', authRoutes);

5. Are there any dependencies or things teammates should know before integrating with your feature?

   - Requires `bcryptjs`, `express-session`, and a MySQL connection (using `mysql2`).
   - Session middleware (`app.use(session(...))`) must be initialized globally in the main app BEFORE mounting these routes.

6. Any additional notes?

   The password_hash for the default admin is bcrypt-hashed value of `adminpassword`. You can change it anytime.

   Put this SQL file inside your feature folder as requested by the README structure teammates will reference it to add to database/schema.sql. This creates the users table with fields for id, username, email, hashed password, role (user/admin), and timestamps.