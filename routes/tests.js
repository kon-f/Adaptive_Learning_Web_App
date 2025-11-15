// routes/tests.js   (Unit tests)
const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Connection with DB

// Table that just has the value correct so we can compare it with user's answers table
const correctAnswers = {
    q1: 'Correct',
    q2: 'Correct',
    q3a: 'Correct',
    q3b: 'Correct'
};

// Route to submit test results
router.post('/submit-test', (req, res) => {
    //request user's answers from frontend
    const { q1, q2, q3a, q3b, userId, testId } = req.body;

    // Check if used already submitted answers to this test
    const checkQuery = 'SELECT * FROM user_answers WHERE user_id = ? AND test_id = ?';
    db.get(checkQuery, [userId, testId], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to check user submission' });
        }

        // Compare whether his answers are correct and increment correct answer's counter
        let correctCount = 0;
        if (q1 === correctAnswers.q1) correctCount++;
        if (q2 === correctAnswers.q2) correctCount++;
        if (q3a === correctAnswers.q3a) correctCount++;
        if (q3b === correctAnswers.q3b) correctCount++;
        //4 questions so calculate grade /10
        let score = (correctCount / 4) * 10;
        //We need tor eplace potential previous answers for the same test by the same user
        //(user_id, test_id, test_instance_id) together are UNIQUE in DB so if we always try to add one user's answers to a specific test with test_instance_id=1, there's conflict
        let testInstanceId = 1;

        // Save answers in table with test_id and replace if there's conflict
        const insertQuery = `INSERT INTO user_answers (user_id, q1, q2, q3a, q3b, test_id, score, test_instance_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id, test_id, test_instance_id)
        DO UPDATE SET q1 = excluded.q1, q2 = excluded.q2, q3a = excluded.q3a, q3b = excluded.q3b, score = excluded.score;
        `;        
        db.run(insertQuery, [userId, q1, q2, q3a, q3b, testId, score, testInstanceId], function(err) {
            if (err) {
                console.error('Error while saving answers:', err.message); // Print error
                return res.status(500).json({ error: 'Failed to save answers' });
            }
            // Return grade to display it to user
            res.json({ message: `Τεστ υποβλήθηκε με επιτυχία! Σωστές απαντήσεις: ${correctCount}/4, Βαθμός: ${score}/10` });
        });
    });
});

//Retrieveing user's answers
router.get('/answers', (req, res) => {
    db.all('SELECT * FROM user_answers', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to retrieve answers' });
        }
        res.json(rows);
    });
});


module.exports = router;
