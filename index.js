const express = require("express");
const cors = require("cors");
const authRouter = require('./authRouter');
const db = require("./db");
const authMiddleware = require("./middleware/authMiddleware");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/auth", authRouter);

app.get("/tickets", authMiddleware, (req, res) => {
  const userId = req.user.id;
  db.all("SELECT * FROM tickets WHERE user_id = ?", [userId], (err, rows) => {
    if (err) {
      console.error("Ошибка при получении тикетов:", err);
      return res.status(500).json({ error: "Ошибка при получении тикетов" });
    }
    return res.json(rows);
  });
});

app.get("/tickets/:id", authMiddleware, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  db.get("SELECT * FROM tickets WHERE id = ? AND user_id = ?", [id, userId], (err, ticket) => {
    if (err) {
      console.error("Ошибка при получении тикета:", err);
      return res.status(500).json({ error: "Ошибка при получении тикета" });
    }
    if (!ticket) {
      return res.json(null);
    }
    db.all(
      "SELECT * FROM ticket_comments WHERE ticket_id = ? ORDER BY id ASC",
      [id],
      (err2, comments) => {
        if (err2) {
          console.error("Ошибка при получении комментариев:", err2);
          return res.status(500).json({ error: "Ошибка при получении комментариев" });
        }
        return res.json({
          ...ticket,
          comments,
        });
      }
    );
  });
});

app.post("/tickets", authMiddleware, (req, res) => {
  const userId = req.user.id;
  const {
    name,
    email,
    subject,
    department,
    service,
    priority,
    message,
    attachment,
    status
  } = req.body;

  const now = new Date().toISOString();
  const finalStatus = status || "Open";

  const sql = `
    INSERT INTO tickets (
      user_id,
      name,
      email,
      subject,
      department,
      service,
      priority,
      message,
      attachment,
      status,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(
    sql,
    [
      userId,
      name,
      email,
      subject,
      department,
      service,
      priority,
      message,
      attachment,
      finalStatus,
      now,
      now
    ],
    function (err) {
      if (err) {
        console.error("Ошибка при создании тикета:", err);
        return res.status(500).json({ error: "Ошибка при создании тикета" });
      }
      return res.json({ id: this.lastID });
    }
  );
});

app.put("/tickets/:id", authMiddleware, (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const {
    name,
    email,
    subject,
    department,
    service,
    priority,
    message,
    attachment,
    status
  } = req.body;

  const now = new Date().toISOString();

  const sql = `
    UPDATE tickets
    SET
      name = ?,
      email = ?,
      subject = ?,
      department = ?,
      service = ?,
      priority = ?,
      message = ?,
      attachment = ?,
      status = ?,
      updated_at = ?
    WHERE id = ?
      AND user_id = ?
  `;

  db.run(
    sql,
    [
      name,
      email,
      subject,
      department,
      service,
      priority,
      message,
      attachment,
      status,
      now,
      id,
      userId 
    ],
    function (err) {
      if (err) {
        console.error("Ошибка при обновлении тикета:", err);
        return res.status(500).json({ error: "Ошибка при обновлении тикета" });
      }
      return res.json({ changes: this.changes });
    }
  );
});

app.delete("/tickets/:id", authMiddleware, (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  db.run(
    "DELETE FROM tickets WHERE id = ? AND user_id = ?",
    [id, userId],
    function (err) {
      if (err) {
        console.error("Ошибка при удалении тикета:", err);
        return res.status(500).json({ error: "Ошибка при удалении тикета" });
      }
      return res.json({ changes: this.changes });
    }
  );
});

app.get("/tickets/:id/comments", (req, res) => {
  const { id } = req.params;
  db.all(
    "SELECT * FROM ticket_comments WHERE ticket_id = ? ORDER BY id ASC",
    [id],
    (err, rows) => {
      if (err) {
        console.error("Ошибка при получении комментариев:", err);
        return res.status(500).json({ error: "Ошибка при получении комментариев" });
      }
      return res.json(rows);
    }
  );
});

app.post("/tickets/:id/comments", (req, res) => {
  const { id } = req.params;
  const { comment_text, attachment } = req.body;

  db.get("SELECT id FROM tickets WHERE id = ?", [id], (err, ticket) => {
    if (err) {
      console.error("Ошибка при проверке тикета:", err);
      return res.status(500).json({ error: "Ошибка при проверке тикета" });
    }
    if (!ticket) {
      return res.status(404).json({ error: "Тикет не найден" });
    }

    const now = new Date();
    const createdAt = now.toISOString();
    const updatedAt = createdAt;

    const sql = `
      INSERT INTO ticket_comments (
        ticket_id, comment_text, attachment, created_at
      )
      VALUES (?, ?, ?, ?)
    `;

    db.run(sql, [id, comment_text, attachment, createdAt], function (err2) {
      if (err2) {
        console.error("Ошибка при добавлении комментария:", err2);
        return res.status(500).json({ error: "Ошибка при добавлении комментария" });
      }
      return res.json({ comment_id: this.lastID });
    });
  });
});

app.delete("/tickets/:ticketId/comments/:commentId", (req, res) => {
  const { ticketId, commentId } = req.params;
  db.run(
    "DELETE FROM ticket_comments WHERE ticket_id = ? AND id = ?",
    [ticketId, commentId],
    function (err) {
      if (err) {
        console.error("Ошибка при удалении комментария:", err);
        return res
          .status(500)
          .json({ error: "Ошибка при удалении комментария" });
      }
      return res.json({ changes: this.changes });
    }
  );
});

app.get("/billing", authMiddleware, (req, res) => {
  const userId = req.user.id;
  db.all("SELECT * FROM billing WHERE user_id = ?", [userId], (err, rows) => {
    if (err) {
      console.error("Ошибка при получении записей billing:", err);
      return res.status(500).json({ error: "Ошибка при получении billing" });
    }
    return res.json(rows);
  });
});

app.get("/billing/:id", authMiddleware, (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  db.get(
    "SELECT * FROM billing WHERE id = ? AND user_id = ?",
    [id, userId],
    (err, row) => {
      if (err) {
        console.error("Ошибка при получении billing:", err);
        return res.status(500).json({ error: "Ошибка при получении billing" });
      }
      return res.json(row || null);
    }
  );
});

app.post("/billing", authMiddleware, (req, res) => {
  const userId = req.user.id;
  const { status, maturitydate, invoicedate, amount } = req.body;

  const finalStatus = status || "Open";
  const sql = `
    INSERT INTO billing (user_id, status, maturitydate, invoicedate, amount)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.run(sql, [userId, finalStatus, maturitydate, invoicedate, amount], function (err) {
    if (err) {
      console.error("Ошибка при вставке в billing:", err);
      return res.status(500).json({ error: "Ошибка при вставке в billing" });
    }
    return res.json({ id: this.lastID });
  });
});

app.put("/billing/:id", authMiddleware, (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { status, maturitydate, invoicedate, amount } = req.body;
  const sql = `
    UPDATE billing
    SET status = ?, maturitydate = ?, invoicedate = ?, amount = ?
    WHERE id = ? AND user_id = ?
  `;
  db.run(sql, [status, maturitydate, invoicedate, amount, id, userId], function (err) {
    if (err) {
      console.error("Ошибка при обновлении billing:", err);
      return res.status(500).json({ error: "Ошибка при обновлении billing" });
    }
    return res.json({ changes: this.changes });
  });
});

app.delete("/billing/:id", authMiddleware, (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  db.run("DELETE FROM billing WHERE id = ? AND user_id = ?", [id, userId], function (err) {
    if (err) {
      console.error("Ошибка при удалении billing:", err);
      return res.status(500).json({ error: "Ошибка при удалении billing" });
    }
    return res.json({ changes: this.changes });
  });
});


const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
