const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');
const { connection } = require('./config/db');
const app = express();
const PORT = process.env.PORT || 3000;

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

// Mount BookListing routes
const bookListingRoutes = require('./views/BookListing/routes/bookListingRoutes');
app.use('/catalog', bookListingRoutes);

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
    const dashboardData = {
        totalUsers: 0,
        totalAdmins: 0,
        totalReservations: 0,
        pendingReservations: 0,
        confirmedReservations: 0,
        expiredReservations: 0,
        newestUsers: [],
        reservations: [] // Placeholder until Milestone 2
    };
    connection.query(
        `
        SELECT
            (SELECT COUNT(*) FROM users) AS totalUsers,
            (SELECT COUNT(*) FROM users WHERE role = 'admin') AS totalAdmins,
            (SELECT COUNT(*) FROM reservations) AS totalReservations,
            (SELECT COUNT(*) FROM reservations WHERE status = 'pending') AS pendingReservations,
            (SELECT COUNT(*) FROM reservations WHERE status = 'confirmed') AS confirmedReservations,
            (SELECT COUNT(*) FROM reservations WHERE status = 'expired') AS expiredReservations
        `,
        (statsError, statsResults) => {
            if (statsError) {
                console.error(statsError);
                return res.render(
                    "AdminDashboard/views/adminDashboard",
                    dashboardData
                );
            }
            dashboardData.totalUsers = statsResults[0].totalUsers;
            dashboardData.totalAdmins = statsResults[0].totalAdmins;
            dashboardData.totalReservations = statsResults[0].totalReservations;
            dashboardData.pendingReservations = statsResults[0].pendingReservations;
            dashboardData.confirmedReservations = statsResults[0].confirmedReservations;
            dashboardData.expiredReservations = statsResults[0].expiredReservations;

            connection.query(
                `
                SELECT
                    username,
                    role,
                    created_at
                FROM users
                ORDER BY created_at DESC
                LIMIT 5
                `,
                (usersError, usersResults) => {
                    if (usersError) {
                        console.error(usersError);
                    } else {
                        dashboardData.newestUsers = usersResults;
                    }
                    res.render(
                        "AdminDashboard/views/adminDashboard",
                        dashboardData
                    );
                }
            );
        }
    );
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});