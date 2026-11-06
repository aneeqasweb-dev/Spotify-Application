const crypto = require('crypto');
const userModel = require('../models/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// Signs a JWT and stores it in an HTTP-only cookie (JavaScript in the browser can't read it)
function setAuthCookie(res, user) {
    const token = jwt.sign({
        id: user._id,
        role: user.role,
    }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.cookie("token", token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: SEVEN_DAYS_MS,
    });
}

function publicUser(user) {
    return {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isGuest: Boolean(user.isGuest),
    };
}

async function registerUser(req, res) {

    const { username, email, password, role = "user" } = req.body || {};

    if (!username || !email || !password) {
        return res.status(400).json({ message: "Username, email and password are required" });
    }
    if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
    }
    if (!['user', 'artist'].includes(role)) {
        return res.status(400).json({ message: "Role must be 'user' or 'artist'" });
    }

    const isUserAlreadyExists = await userModel.findOne({
        $or: [
            { username: username },
            { email: email }
        ]
    })
    if (isUserAlreadyExists) {
        return res.status(409).json({ message: "User already exists" });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await userModel.create({
        username,
        email,
        password: hash,
        role
    })

    setAuthCookie(res, user);

    res.status(201).json({
        message: "user registered successfully",
        user: publicUser(user)
    })
}

async function loginUser(req, res) {
    const { username, email, password } = req.body || {};

    if ((!username && !email) || !password) {
        return res.status(400).json({ message: "Username or email, and password are required" });
    }

    // Only search by the fields that were actually sent
    const conditions = [];
    if (username) conditions.push({ username });
    if (email) conditions.push({ email });

    const user = await userModel.findOne({ $or: conditions })
    if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    setAuthCookie(res, user);

    res.status(200).json({
        message: "user logged in successfully",
        user: publicUser(user)
    })
}

async function logoutUser(req, res) {
    res.clearCookie("token");
    res.status(200).json({ message: "User logged out successfully" });
}

// Returns the logged-in user. The frontend calls this on page load,
// because it can't read the HTTP-only cookie itself.
async function getMe(req, res) {
    const user = await userModel.findById(req.user.id).select('-password');

    if (!user) {
        res.clearCookie("token");
        return res.status(401).json({ message: "Unauthorized" });
    }

    res.status(200).json({
        message: "user fetched successfully",
        user: publicUser(user)
    })
}

// POST /api/auth/guest — "Continue as guest": a temporary listener account, no sign-up needed.
// MongoDB deletes it automatically after 7 days (see expiresAt in the user model).
async function guestLogin(req, res) {
    const password = await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 10); // nobody knows it
    const expiresAt = new Date(Date.now() + SEVEN_DAYS_MS);

    for (let attempt = 0; attempt < 5; attempt++) {
        const id = crypto.randomInt(10000, 100000);
        try {
            const user = await userModel.create({
                username: `Guest${id}`,
                email: `guest${id}-${crypto.randomBytes(3).toString('hex')}@guest.beatflow.local`,
                password,
                role: 'user',
                isGuest: true,
                expiresAt,
            });
            setAuthCookie(res, user);
            return res.status(201).json({ message: "Welcome, guest!", user: publicUser(user) });
        } catch (err) {
            if (err.code !== 11000) throw err; // 11000 = that guest name is taken, try another
        }
    }
    return res.status(503).json({ message: "Couldn't start a guest session. Please try again." });
}

module.exports = { registerUser, loginUser, logoutUser, getMe, guestLogin }
