/**
 * seed.js
 * ---------------------------------------------
 * Populates the SQLite database with generic,
 * non-sensitive placeholder data for demo use.
 *
 * This file is intended *only* for local development
 * and is safe for public repositories.
 *
 * To run:
 *     node seed.js
 * ---------------------------------------------
 */

const db = require('./db');
const bcrypt = require('bcrypt');

// ---------------------------------------------------
// 1. Placeholder Users
// ---------------------------------------------------

const users = [
  { username: 'demo_user1', password: 'password123' },
  { username: 'demo_user2', password: 'password123' }
];

// ---------------------------------------------------
// 2. Placeholder Questions for Review Tests
// ---------------------------------------------------

/*
  These questions are intentionally generic.  
  They do NOT reflect any real content from the
  original educational material.
*/

const questions = [
  // Unit 1 ------------------------------------------------
  {
    unit_id: 1,
    question_text: 'What is the color of the sky on a clear day?',
    question_type: 'multiple_choice',
    answer_options: JSON.stringify(["Blue", "Green", "Red"]),
    correct_answer: 'Blue'
  },
  {
    unit_id: 1,
    question_text: 'The sun rises in the east.',
    question_type: 'true_false',
    answer_options: null,
    correct_answer: 'true'
  },

  // Unit 2 ------------------------------------------------
  {
    unit_id: 2,
    question_text: 'Which number is greater?',
    question_type: 'multiple_choice',
    answer_options: JSON.stringify(["10", "5", "2"]),
    correct_answer: '10'
  },
  {
    unit_id: 2,
    question_text: 'Placeholder true/false question for unit 2.',
    question_type: 'true_false',
    answer_options: null,
    correct_answer: 'false'
  },

  // Unit 3 ------------------------------------------------
  {
    unit_id: 3,
    question_text: 'Which shape has three sides?',
    question_type: 'multiple_choice',
    answer_options: JSON.stringify(["Triangle", "Circle", "Square"]),
    correct_answer: 'Triangle'
  },
  {
    unit_id: 3,
    question_text: 'A placeholder statement that is always true.',
    question_type: 'true_false',
    answer_options: null,
    correct_answer: 'true'
  }
];

// ---------------------------------------------------
// Seed Execution
// ---------------------------------------------------

async function seed() {
  console.log("🔄 Seeding database with placeholder data...\n");

  // Insert Users -------------------------------------
  for (let user of users) {
    const hashed = await bcrypt.hash(user.password, 10);

    db.run(
      `INSERT INTO users (username, password) VALUES (?, ?)`,
      [user.username, hashed],
      err => {
        if (err) {
          console.log(`⚠️  User '${user.username}' already exists (or error).`);
        } else {
          console.log(`✔️  User added: ${user.username}`);
        }
      }
    );
  }

  // Insert Questions ---------------------------------
  for (let q of questions) {
    db.run(
      `INSERT INTO questions (unit_id, question_text, question_type, answer_options, correct_answer)
       VALUES (?, ?, ?, ?, ?)`,
      [q.unit_id, q.question_text, q.question_type, q.answer_options, q.correct_answer],
      err => {
        if (err) {
          console.log(`⚠️  Question for unit ${q.unit_id} already exists (or error).`);
        } else {
          console.log(`✔️  Question inserted for unit ${q.unit_id}`);
        }
      }
    );
  }

  console.log("\n🎉 Seeding complete!");
}

seed();
