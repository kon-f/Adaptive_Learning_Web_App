const express = require('express');
const db = require('../config/db');
const router = express.Router();



// Route to retrieve user's progress
router.post('/progress', (req, res) => {
    const userId = req.body.userId;  // Take userId from frontend

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    // How many times did user visit each unit?
    const visitsQuery = `
        SELECT module_id, visit_count 
        FROM user_visits
        WHERE user_id = ?
    `;

    // What were his test results?
    const answersQuery = `
        SELECT id, test_id, q1, q2, q3a, q3b, score 
        FROM user_answers
        WHERE user_id = ?
        ORDER BY id ASC
    `;

    // Run first query (visits)
    db.all(visitsQuery, [userId], (err, visits) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }

        // Run 2nd query (results)
        db.all(answersQuery, [userId], (err, answers) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Database error' });
            }

            // Return data to client
            res.json({ visits, answers });
        });
    });
});



module.exports = router;
