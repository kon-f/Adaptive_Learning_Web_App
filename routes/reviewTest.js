const express = require('express');
const router = express.Router();
const db = require('../config/db');

//Pull review questions from DB
router.get('/get-review-test-questions', (req, res) => {

    //Depending on user's results in each unit we'll change the probability of that unit's questions appearing
    const userId = req.query.userId;

    //If he barely passed the test in a unit, we need higher probability to show questions from that, so check scores
    //Also make sure which units he completed (score>=5) to display questions only from those units
    const query = `
        SELECT q.*, 
               CASE 
                    WHEN ua.score BETWEEN 5 AND 7 THEN 3  
                    WHEN ua.score BETWEEN 7 AND 8 THEN 2  
                    WHEN ua.score BETWEEN 9 AND 10 THEN 1 
                END AS probability
        FROM questions q
        JOIN user_answers ua ON q.unit_id = ua.test_id
        WHERE ua.user_id = ? AND ua.score >= 5
        ORDER BY probability DESC, RANDOM()
        LIMIT 5
    `;
    //We need only 5 questions, randomly chosen according to specified probability

    //Execute the query with error check
    db.all(query, [userId], (err, rows) => {
        if (err) {
            console.error('SQL Error:', err.message);
            return res.status(500).json({ error: 'Failed to retrieve questions' });
        }
        res.json({ questions: rows });
    });
});

//Submission of review test, DB save and grading
router.post('/submit-review-test', (req, res) => {
    //Call important info from html
    const { userId, testId, responses } = req.body;

    //How many questions were correct
    let correctCount = 0;

    // List of promises so that we wait for all questions to be checked. Js is asynchronous!
    const promises = responses.map(response => {
        return new Promise((resolve, reject) => {
            //Retrieve correct answers from DB
            const query = 'SELECT correct_answer FROM questions WHERE id = ?';
            
            db.get(query, [response.questionId], (err, row) => {
                if (err) {
                    console.error('Error retrieving correct answer:', err.message);
                    return reject(err);
                }

                // Compare user's answer with the correct one and if correct, add it to correct counter
                if (row.correct_answer === response.answer) {
                    correctCount++;
                }
                
                resolve(); // Complete the promise
            });
        });
    });

    // We wait for all questions to be checked
    Promise.all(promises)
        .then(() => {
            // Calculate the grade
            let score = (correctCount / 5) * 10;

            // Find max test_instance_id for the user for test_id = 4. The 3 of them together MUST be UNIQUE
            db.get(`SELECT MAX(test_instance_id) as max_id FROM user_answers WHERE user_id = ? AND test_id = ?`, [userId, testId], (err, row) => {
                if (err) {
                    console.error('Error retrieving max instance ID:', err.message);
                    return res.status(500).json({ error: 'Failed to retrieve max instance ID' });
                }

                // Increment test_instance_id by 1
                const testInstanceId = row && row.max_id ? row.max_id + 1 : 1; // Start from 1 if there is no prior entry

                // Save results into user_answers. Answers in each questions are not important since they don't appear in the review test statically
                const insertQuery = `
                    INSERT INTO user_answers (user_id, test_id, test_instance_id, score) 
                    VALUES (?, ?, ?, ?)
                `;

                //Run the query
                db.run(insertQuery, [userId, testId, testInstanceId, score], function(err) {
                    if (err) {
                        console.error('Error while saving score:', err.message);
                        return res.status(500).json({ error: 'Failed to save score' });
                    }

                    // Now display result of test to the user
                    res.json({ message: `Σωστές απαντήσεις: ${correctCount}/5, Βαθμός: ${score}/10` });
                });
            });
        })
        //Catch possible errors
        .catch(error => {
            console.error('Error processing responses:', error);
            res.status(500).json({ error: 'Failed to process responses' });
        });
});


module.exports = router;
