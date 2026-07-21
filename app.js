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
// DISABLED - this was shadowing catalogRoutes below (both mounted at
// '/catalog', both define GET '/', and this one being registered first
// meant it always won). This version's Reserve button links to
// /reservations/new?bookId=... which doesn't match any route Min actually
// built - that's the "Cannot GET" error. catalogRoutes below is the
// working version - its Reserve form already matches Min's real
// POST /reservations/book/:id route correctly.
// Ai Li: please confirm which of these two implementations
// (bookListingController/booklist.ejs vs catalogController/catalog.ejs)
// should be kept, and remove the other's files entirely once decided.
// const bookListingRoutes = require('./views/BookListing/routes/bookListingRoutes');
// app.use('/catalog', bookListingRoutes);

// Mount UIIntegration routes
const uiRoutes = require('./views/UIIntegration/routes/uiRoutes');
app.use(uiRoutes);

// Mount Reviews routes (view/add reviews for a specific book)
const reviewRoutes = require('./views/Reviews/routes/reviewRoutes');
app.use('/reviews', reviewRoutes);

// Mount Reservation routes (create / approve / reject / delete a reservation)
const reservationRoutes = require('./views/Reservation/routes/reservationRoutes');
app.use('/reservations', reservationRoutes);

// Mount BookListing routes (public/user-facing catalog with filters)
const catalogRoutes = require('./views/BookListing/routes/catalogRoutes');
app.use('/catalog', catalogRoutes);

// Root route
app.get('/', (req, res) => {
    if (req.session && req.session.user_id) {
        return res.redirect('/dashboard');
    }
    res.render('UIIntegration/views/home', { title: 'Welcome' });
});

// Admin Dashboard
const authMiddleware = require('./middleware/authMiddleware');
const adminMiddleware = require('./middleware/adminMiddleware');
const ReservationModel = require('./views/Reservation/models/reservationModel');

app.get('/admin', authMiddleware, adminMiddleware, (req, res) => {
    const dashboardData = {
        totalUsers: 0,
        totalAdmins: 0,
        totalReservations: 0,
        pendingReservations: 0,
        confirmedReservations: 0,
        expiredReservations: 0,
        newestUsers: [],
        reservations: [],
        overdueReservations: []
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

                    ReservationModel.getAllReservations((resError, resResults) => {
                        if (resError) {
                            console.error(resError);
                        } else {
                            dashboardData.reservations = resResults;
                        }

                        ReservationModel.getOverdueReservations((overdueError, overdueResults) => {
                            if (overdueError) {
                                console.error(overdueError);
                            } else {
                                dashboardData.overdueReservations = overdueResults;
                            }
                            res.render(
                                "AdminDashboard/views/adminDashboard",
                                dashboardData
                            );
                        });
                    });
                }
            );
        }
    );
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});