const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');

const app = express();
const PORT = 3000;

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Body parsing middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session middleware
app.use(session({
    secret: 'library-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Flash messages middleware
app.use(flash());

// Make flash available in all templates
app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});

// Mount auth routes
const authRoutes = require('./views/Authentication/routes/authRoutes');
app.use('/auth', authRoutes);

// Root route
app.get('/', (req, res) => {
    res.send('Library Management System is running!');
});

// Admin Dashboard
app.get('/admin', (req, res) => {

    const reservations = [
    {
        reservationId: 1,
        bookId: 101,
        bookTitle: "Atomic Habits",
        username: "student01",
        reservationDate: "2026-07-19",
        expiryDate: "2026-08-02",
        status: "Pending"
    },
    {
        reservationId: 2,
        bookId: 102,
        bookTitle: "The Psychology of Money",
        username: "student02",
        reservationDate: "2026-07-20",
        expiryDate: "2026-08-03",
        status: "Pending"
    }
    ];

    res.render(
        "features/AdminDashboard/views/adminDashboard",
        { reservations: reservations }
    );

});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});