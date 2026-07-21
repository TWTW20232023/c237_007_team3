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

   - `GET /auth/signup`:    Show sign-up form

   - `POST /auth/signup`:   Handle new user registration (hashes password with bcryptjs)

   - `GET /auth/login`:     Show login form

   - `POST /auth/login`:    Authenticate user against DB and start session

   - `GET /auth/logout`:    Destroy the current session

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

This creates the users table with fields for:

user_id (INT, AUTO_INCREMENT, PRIMARY KEY)
username (VARCHAR(50), UNIQUE, NOT NULL)
email (VARCHAR(100), UNIQUE, NOT NULL)
password_hash (VARCHAR(255), NOT NULL)
role (ENUM('user', 'admin'), DEFAULT 'user')
created_at / updated_at (TIMESTAMP with auto-managed values)
Default Admin Account
A default admin account is seeded on schema creation:

Field	Value
Username	admin
Email	admin@library.com
Password	adminpassword
Role	admin
You can change the password anytime via the reset-password flow or directly in the database.

7. Forgot-Password / OTP Flow Overview
User visits /auth/forgot-password and enters their email.
If the email exists, a 6-digit OTP is generated and stored in the session with a 15-minute expiry. The OTP is logged to the console (email sending TBD).
User is redirected to /auth/verify-otp where they enter the OTP.
On successful verification, user is redirected to /auth/reset-password?email=....
User enters and confirms a new password — it is hashed with bcryptjs and saved to the database.
A success page (reset-success.ejs) is shown.
8. Additional Notes
After successful sign-up, users are redirected to /auth/login.
After successful login, admins are redirected to /admin, regular users to / (home).
The showAdminDashboa