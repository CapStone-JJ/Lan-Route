const jwt = require("jsonwebtoken");
const process = require("process");

const protection = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).send("No token provided.");
    }

    const token = authHeader.split(" ")[1];

    try {
        req.user = jwt.verify(token, process.env.JWT);
        next();
    } catch (error) {
        return res.status(403).send("Failed to authenticate token.");
    }
};

module.exports = protection;

