const db = require('../config/db');

const getProfile = async (req, res) => {
    try {
        const [users] = await db.execute(
            `SELECT id, username, full_name, email, created_at
             FROM users
             WHERE id = ?`,
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Profile fetched successfully',
            user: users[0]
        });
    } catch (error) {
        console.error('Profile error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

module.exports = {
    getProfile
};