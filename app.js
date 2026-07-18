const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');

const app = express();
const PORT = 3000;

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
// Lets any template use <%- include('/partials/head') %> regardless of
// which feature folder it's rendered from - needed for the shared navbar.
app.set('view options', { root: path.join(__dirname, 'views') });

// Body parsing middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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

// Make session state available to every template as loggedIn/username/role -
// these are the REAL session fields Authentication sets on login
// (req.session.user_id / username / role), not an invented `user` object.
app.use((req, res, next) => {
    res.locals.loggedIn = !!(req.session && req.session.user_id);
    res.locals.username = req.session ? req.session.username : null;
    res.locals.role = req.session ? req.session.role : null;
    next();
});

// Mount auth routes
const authRoutes = require('./views/Authentication/routes/authRoutes');
app.use('/auth', authRoutes);

// Mount BookCRUD routes
const bookRoutes = require('./views/BookCRUD/routes/bookRoutes');
app.use('/books', bookRoutes);

// Mount UIIntegration routes
const uiRoutes = require('./views/UIIntegration/routes/uiRoutes');
app.use(uiRoutes);

// Root route
app.get('/', (req, res) => {
    if (req.session && req.session.user_id) {
        return res.redirect('/dashboard');
    }
    res.render('UIIntegration/views/home', { title: 'Welcome' });
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
        "AdminDashboard/views/adminDashboard",
        { reservations: reservations }
    );

});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});