require('dotenv').config();

const express = require('express');
const db = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'User Authentication API is running'
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Handle invalid routes
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        const connection = await db.getConnection();
        connection.release();

        console.log('MySQL connected successfully!');

        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Database connection failed:', error.message);
        process.exit(1);
    }
}

startServer();  