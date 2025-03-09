const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const { secret } = require("./config");
const db = require("./db");            

const generateAccessToken = (id, roles) => {
  const payload = { id, roles };
  return jwt.sign(payload, secret, { expiresIn: "24h" });
};

class authController {
  async registration(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: "Ошибка при регистрации", errors });
      }

      const { email, name, password } = req.body;

      db.get(
        `SELECT * FROM users WHERE email = ?`,
        [email],
        (err, existingUser) => {
          if (err) {
            console.error("Ошибка при проверке email:", err);
            return res.status(500).json({ message: "Ошибка при проверке email" });
          }

          if (existingUser) {
            return res
              .status(400)
              .json({ message: "Пользователь с таким email уже существует" });
          }

          const hashPassword = bcrypt.hashSync(password, 7);
          const roles = JSON.stringify(["USER"]);

          db.run(
            `INSERT INTO users (email, name, password, roles) VALUES (?, ?, ?, ?)`,
            [email, name, hashPassword, roles],
            function (insertErr) {
              if (insertErr) {
                console.error("Ошибка при регистрации:", insertErr);
                return res.status(400).json({ message: "Ошибка при регистрации" });
              }

              return res.json({ message: "Пользователь успешно зарегистрирован" });
            }
          );
        }
      );
    } catch (e) {
      console.log(e);
      res.status(400).json({ message: "Registration error" });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;

      db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
        if (err) {
          console.error("Ошибка при запросе к БД:", err);
          return res.status(500).json({ message: "Ошибка при запросе к БД" });
        }
        if (!user) {
          return res.status(400).json({ message: "Неверный email или пароль" });
        }

        const validPassword = bcrypt.compareSync(password, user.password);
        if (!validPassword) {
          return res.status(400).json({ message: "Неверный email или пароль" });
        }

        const roles = user.roles ? JSON.parse(user.roles) : [];
        const token = generateAccessToken(user.user_id, roles);

        return res.json({ token });
      });
    } catch (e) {
      console.log(e);
      res.status(400).json({ message: "Login error" });
    }
  }

  async getUserInfo(req, res) {
    try {
      const userId = req.user.id;

      db.get(
        `SELECT email, name FROM users WHERE user_id = ?`,
        [userId],
        (err, row) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ message: "Ошибка при получении пользователя" });
          }
          if (!row) {
            return res.status(404).json({ message: "Пользователь не найден" });
          }
          return res.json(row);
        }
      );
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Ошибка сервера" });
    }
  }
}

module.exports = new authController();
