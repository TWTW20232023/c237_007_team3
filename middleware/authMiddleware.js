const authMiddleware = (req, res, next) => {
    // Check if user is logged in by verifying they have a user_id in their session
    if (req.session && req.session.user_id) {
        return next();
    }
    // If not logged in, redirect to the login page
    else {
        console.log('AuthMiddleware: Access Denied. User is not logged in.');
        res.redirect('/auth/login');
    }
};

module.exports = authMiddleware;