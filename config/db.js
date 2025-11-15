const sqlite3 = require('sqlite3').verbose(); //SQLite since we don't need a very complex DB
const path = require('path'); 
const db = new sqlite3.Database(path.join(__dirname, 'user_progress.db'));

const bcrypt = require('bcrypt');

//Users table with credentials and user_id
db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    )
  `);
  
// user_visits saves visits in each unit
db.run(`
    CREATE TABLE IF NOT EXISTS user_visits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      module_id INTEGER NOT NULL,
      visit_count INTEGER DEFAULT 1,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(module_id) REFERENCES modules(id)
    )
  `);

//Save each users level for specific units
db.run(`
    CREATE TABLE IF NOT EXISTS learning_paths (
        user_id INTEGER,
        current_level TEXT CHECK(current_level IN ('beginner', 'intermediate', 'advanced')),
        unit_id INTEGER,
        FOREIGN KEY(user_id) REFERENCES users(id),
        PRIMARY KEY (user_id, unit_id)
    )
  `);
  
// Save user's answers and score in each test
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS user_answers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            q1 TEXT,
            q2 TEXT,
            q3a TEXT,
            q3b TEXT,
            test_id INTEGER,
            test_instance_id INTEGER,
            score INTEGER,
            FOREIGN KEY (user_id) REFERENCES users(id)
            UNIQUE (user_id, test_id, test_instance_id)
        )
    `, (err) => {
        if (err) {
            return console.error('Error creating table:', err.message);
        }
        console.log("Table 'user_answers' created or already exists.");
    });
});

//Saves questions that can be used for the review test
db.run(`
    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      unit_id INTEGER, 
      question_text TEXT,
      question_type TEXT, 
      answer_options TEXT, 
      correct_answer TEXT 
    )
  `, function(err) {
      if (err) {
          return console.error("Error creating table:", err.message);
      }
      console.log("Table 'questions' created successfully");
  });

module.exports = db;  