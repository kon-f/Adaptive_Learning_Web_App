const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Route to calculate user's level for a certain unit
router.post('/calculate-level', (req, res) => {
    const userId = req.body.userId;
    const unitId = req.body.unitId; // For what Unit? (e.g. 2 for Unit 2)
    const testId = unitId - 1; // To calculate unit 2, we need to check last unit's test.

    // Retrieve score from last units test
    const getScoreQuery = `SELECT score FROM user_answers WHERE user_id = ? AND test_id = ?`;
    db.get(getScoreQuery, [userId, testId], (err, row) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error fetching test score' });
        }

        const score = row ? row.score : 0;

        // Take number of visits in last unit's lesson
        const getVisitsQuery = `SELECT visit_count FROM user_visits WHERE user_id = ? AND module_id = ?`;
        db.get(getVisitsQuery, [userId, testId], (err, row) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Error fetching visit count' });
            }

            const visitCount = row ? row.visit_count : 0;
            let level;

            // Calculate level based on score and visit_count
            if (score > 8 && visitCount < 4) {
                level = 'advanced';
            } else if (score > 8 && visitCount >= 4) {
                level = 'intermediate';
            } else if (score > 5) {
                level = 'beginner';
            } else {
                level = 'beginner';  // Default level
            }

            // Now save said level for this unit in the learning_paths table. If there already was one, update
            const upsertQuery = `
                INSERT INTO learning_paths (user_id, current_level, unit_id) 
                VALUES (?, ?, ?)
                ON CONFLICT(user_id, unit_id) 
                DO UPDATE SET current_level = excluded.current_level
            `;
            db.run(upsertQuery, [userId, level, unitId], function(err) {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: 'Error saving learning path' });
                }
                res.json({ message: 'Learning path updated', level });
            });
        });
    });
});

// Route to return level of user from learning_paths
router.get('/user-level', (req, res) => {
    const userId = req.query.userId;
    const unitId = req.query.unitId;

    const query = `SELECT current_level FROM learning_paths WHERE user_id = ? AND unit_id = ?`;
    db.get(query, [userId, unitId], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to retrieve user level' });
        }
        res.json(row || { current_level: 'beginner' }); // Return 'beginner' if there was none
    });
});

module.exports = router;
