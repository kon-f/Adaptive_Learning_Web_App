// routes/modules.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Route to return Units
router.get('/modules', (req, res) => {
    const userId = req.query.userId; // Retrieve userId

    // SQL query to check users grade in each test. We need to check if he completed last unit's test to unlock each unit
    const query = `
        SELECT test_id, score
        FROM user_answers
        WHERE user_id = ?
    `;

    db.all(query, [userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to retrieve test scores' });
        }

        // Here are our Units with their descriptions. 4 is for the Review test
        const modules = [
            { id: 1, title: "1. Ιστορικό Πλαίσιο Ανέγερσης", description: "Τα γεγονότα που οδήγησαν στην ανέγερση του και η αρχαία ιστορία της" },
            { id: 2, title: "2. Μετατροπή σε Βυζαντινό Ναό", description: "Η πορεία της ανά τους αιώνες, όπου παντρέυτηκε ο ελληνισμός, η ρωμαϊκότητα και ο χριστιανισμός" },
            { id: 3, title: "3. Πολιτιστική Κληρονομιά και Προκλήσεις Αναστήλωσης", description: "Εξερεύνηση των προκλήσεων στη διατήρηση του μνημείου και της κληρονομιάς του, καθώς και της μεγάλης προσπάθειας για την αναστήλωσή του" },
            { id: 4, title: "Επαναληπτικό Τεστ", description: "Τεστ που ενεργοποείται μετά την επιτυχή ολοκλήρωση της πρώτης ενότητας και εμφανίζει ερωτήσεις ανάλογα την πρόοδο του μαθητή"},
        ];

        // We check the grades of the user for each test
        const testScores = {};
        rows.forEach(row => {
            testScores[row.test_id] = row.score;
        });

        // Find which units should be unlocked
        const unlockedModules = modules.map((module, index) => {
            let unlocked = true;

            // First unit needs to be always unlocked
            if (module.id > 1) {
                // We check if user received a passing grade in last test
                const previousTestId = module.id - 1;
                const previousScore = testScores[previousTestId] || 0;
                unlocked = previousScore >= 5; // If he has score >= 5, then he passed, it's true and unlocked becomes true. Otherwise, false
            }
            // We need to unlock review test the momment test 1 receives a passing grade (same time as unit 2 get's unlocked) 
            if (module.id === 4 && testScores[1] !== undefined && testScores[1] >= 5) {
                unlocked = true;
            }

            return {
                ...module,
                unlocked
            };
        });

        // Return units along with whether they are unlocked or not
        res.json(unlockedModules);
    });
});


// Route to count unit visits
router.post('/module-visit', (req, res) => {
    const { user_id, module_id } = req.body;

    // First check if this user has visited this specific unit before
    const checkVisitQuery = `SELECT * FROM user_visits WHERE user_id = ? AND module_id = ?`;
    db.get(checkVisitQuery, [user_id, module_id], (err, row) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: 'Database error' });
            return;
        }

        if (row) {
            // If yes, increment visit counts
            const updateQuery = `UPDATE user_visits SET visit_count = visit_count + 1 WHERE user_id = ? AND module_id = ?`;
            db.run(updateQuery, [user_id, module_id], function(err) {
                if (err) {
                    console.error(err);
                    res.status(500).json({ error: 'Database update error' });
                    return;
                }
                res.json({ message: 'Visit count updated' });
            });
        } else {
            // If not, insert a new line with visit_count=1
            const insertQuery = `INSERT INTO user_visits (user_id, module_id, visit_count) VALUES (?, ?, 1)`;
            db.run(insertQuery, [user_id, module_id], function(err) {
                if (err) {
                    console.error(err);
                    res.status(500).json({ error: 'Database insert error' });
                    return;
                }
                res.json({ message: 'New visit count recorded' });
            });
        }
    });
});


module.exports = router;
