const express = require('express');
const session = require('express-session');
const path = require('path');
const mysql = require('mysql2');

const app = express();

// =========================================================================
// 1. DATA PARSING & STATIC ASSETS MIDDLEWARE
// =========================================================================
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// =========================================================================
// 2. VIEW ENGINE CONFIGURATION (EJS SEARCH PATHS)
// =========================================================================
app.set('view engine', 'ejs');
// Configure EJS to search both the traditional views folder and the separate feature folders
app.set('views', [
    path.join(__dirname, 'views'),
    path.join(__dirname, 'features')
]);

// =========================================================================
// 3. XYLON'S REQUISITE ROUTING SESSION UTILITIES
// =========================================================================
app.use(session({
    secret: 'c237_library_secret_key_2026',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 24-hour active login window
}));

// Global layout utility variable to pass user profile tags cleanly down to template navbars
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// =========================================================================
// 4. ROUTE ROUTERS IMPORT MANAGEMENT
// =========================================================================
// Xylon — Auth & Registration
const authRoutes = require('./features/Authentication/routes/authRoutes');

// Syafiq — Book CRUD (Admin-facing)
const bookCrudRoutes = require('./features/BookCRUD/routes/bookRoutes');

// Ai Li — Book Listing & Filter (User-facing)
const bookListingRoutes = require('./features/BookListing/routes/bookListingRoutes');

// Min (You) — Reservation Creation & Tracking Dashboard
const reservationRoutes = require('./features/Reservation/routes/reservationRoutes');

// Tristan — Admin Approval Dashboard
const adminDashboardRoutes = require('./features/AdminDashboard/routes/adminDashboardRoutes');

// =========================================================================
// 5. APPLICATION GATEWAY BOUND ROUTING DISPATCHERS
// =========================================================================
app.use('/auth', authRoutes);
app.use('/admin/books', bookCrudRoutes);
app.use('/books', bookListingRoutes);
app.use('/reservations', reservationRoutes);
app.use('/admin/dashboard', adminDashboardRoutes);

// Base welcome landpage redirect pathway configuration
app.get('/', (req, res) => {
    res.redirect('/books');
});

// Catch-all 404 Route Handler fallback rule execution profile
app.use((req, res) => {
    res.status(404).render('features/BookCRUD/views/public-not-found');
});

// =========================================================================
// 6. DEPLOYMENT CORE RUNTIME PORT ACTIVATION
// =========================================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`===========================================================`);
    console.log(`🚀 Server successfully activated and running on Port: ${PORT}`);
    console.log(`🔗 Target Environment: http://localhost:${PORT}`);
    console.log(`===========================================================`);
});

module.exports = app;