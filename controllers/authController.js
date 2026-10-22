const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// REGISTER USER
const registerUser = async (req, res) => {
    try {
        const { username, full_name, email, password } = req.body;

        if (
            typeof full_name !== 'string' ||
            typeof email !== 'string' ||
            typeof password !== 'string' ||
            !full_name.trim() ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: 'Full name, email and password are required'
            });
        }

        const normalizedName = full_name.trim();
        const normalizedEmail = email.trim().toLowerCase();
        const normalizedUsername =
            typeof username === 'string' && username.trim()
                ? username.trim()
                : normalizedName;

        if (normalizedName.length > 100) {
            return res.status(400).json({
                success: false,
                message: 'Full name cannot exceed 100 characters'
            });
        }

        if (normalizedUsername.length > 50) {
            return res.status(400).json({
                success: false,
                message: 'Username cannot exceed 50 characters'
            });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid email'
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters'
            });
        }

        const [existingUsers] = await db.execute(
            'SELECT id FROM users WHERE email = ?',
            [normalizedEmail]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Email already registered'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await db.execute(
            `INSERT INTO users
                (username, full_name, email, password)
             VALUES (?, ?, ?, ?)`,
            [
                normalizedUsername,
                normalizedName,
                normalizedEmail,
                hashedPassword
            ]
        );

        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: {
                id: result.insertId,
                username: normalizedUsername,
                full_name: normalizedName,
                email: normalizedEmail
            }
        });
    } catch (error) {
        console.error('Registration error:', error.message);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                message: 'Email already registered'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// LOGIN USER
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (
            typeof email !== 'string' ||
            !email.trim() ||
            typeof password !== 'string' ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const [users] = await db.execute(
            `SELECT id, username, full_name, email, password
             FROM users
             WHERE email = ?`,
            [normalizedEmail]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Incorrect email'
            });
        }

        const user = users[0];

        const passwordMatches = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                message: 'Incorrect password'
            });
        }

        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET is missing');

            return res.status(500).json({
                success: false,
                message: 'Server configuration error'
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN || '1h'
            }
        );

        return res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                full_name: user.full_name,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

module.exports = {
    registerUser,
    loginUser
};