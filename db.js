const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./db.db", (err) => {
  if (err) {
    console.error("Ошибка при соединении с БД:", err);
  } else {
    console.log("Подключено к SQLite.");
  }
});


db.run(
  `CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT,
    email TEXT,
    subject TEXT,
    department TEXT,
    service TEXT,
    priority TEXT,
    message TEXT,
    attachment TEXT,
    status TEXT,
    created_at TEXT,
    updated_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
  )`,
  (err) => {
    if (err) {
      console.error("Ошибка при создании таблицы tickets:", err);
    }
  }
);

db.run(
  `CREATE TABLE IF NOT EXISTS ticket_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER,
    comment_text TEXT,
    attachment TEXT,
    created_at TEXT,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
  )`,
  (err) => {
    if (err) {
      console.error("Ошибка при создании таблицы ticket_comments:", err);
    }
  }
);

db.run(
  `CREATE TABLE IF NOT EXISTS users (
      user_id INTEGER PRIMARY KEY,
      email TEXT NOT NULL,
      name TEXT NOT NULL,
      password TEXT NOT NULL,
      roles TEXT
  )`,
  (err) => {
    if (err) {
      console.error("Ошибка при создании таблицы users:", err);
    }
  }
);

db.run(
  `CREATE TABLE IF NOT EXISTS billing (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    status TEXT,
    maturitydate TEXT,
    invoicedate TEXT,
    amount REAL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
  )`,
  (err) => {
    if (err) {
      console.error("Ошибка при создании таблицы billing:", err);
    }
  }
);

module.exports = db;
