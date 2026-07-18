const adminMiddleware = (req, res, next) => {
    // Check if user is logged in AND has an 'admin' role
    if (req.session && req.session.user_id && req.session.role === 'admin') {
        return next();
    }
    // If they are not an admin, give them a 403 Forbidden error
    else {
        console.log('AdminMiddleware: Access Denied. User is not an admin.');
        res.status(403).send('<h1>403 - Access Denied</h1><p>You must be logged in as an Admin to view this page.</p>');
    }
};

module.exports = adminMiddleware;