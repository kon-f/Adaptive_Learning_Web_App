//Our server to connect everything. We will use Express. Also display starting(index) page and handle user log-in
//Dependencies:
const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
//all the paths that contain files that will be used:
const db = require('./config/db');
const progressRoutes = require('./routes/progress');
const testRoutes = require('./routes/tests');
const learningPathsRoutes = require('./routes/learningpaths');
const reviewTestRoutes = require('./routes/reviewTest');
const modulesRoute = require('./routes/modules');

const app = express();
const PORT = 3000;

// Middleware to read JSON
app.use(express.json());
app.use(bodyParser.json()); // To read JSON from request body

// Serves static files from file public:
app.use(express.static(path.join(__dirname, 'public')));

// Route for index page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use('/api', modulesRoute); // Add route for units

// Route for student's progress
app.use('/', progressRoutes);

app.use('/api', testRoutes);  // Route for tests

app.use('/api', learningPathsRoutes); // Route for learning_paths

app.use('/review-test', reviewTestRoutes); // Route for review tests

// User's log-in
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Find user in DB based on username
    const sql = 'SELECT * FROM users WHERE username = ?';
    db.get(sql, [username], (err, user) => {
        //If there's no such user, notify!
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(400).json({ error: 'Ο χρήστης δεν βρέθηκε' });

        // If we found them, then check password (hashed)
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!isMatch) return res.status(400).json({ error: 'Λάθος κωδικός' });

            // If everything matches, log in user
            res.json({ message: 'Σύνδεση επιτυχής', userId: user.id });
        });
    });
});

// Starting the server in PORT (here it's 3000)
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});