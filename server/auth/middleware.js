const jwt = require("jsonwebtoken");
require("dotenv").config();

function authenticateUser(req, res, next) {
    const auth = req.headers.authorization;
    const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
    try {
        if (token) {
            req.user = jwt.verify(token, process.env.JWT_SECRET);
        } else {
            req.user = null;
        }
    } catch (error) {
        console.error("JWT verification error:", error);
    }
    next();
}

module.exports = {
    authenticateUser,
};
