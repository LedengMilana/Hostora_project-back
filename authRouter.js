const Router = require("express");
const router = new Router();
const controller = require("./authController");
const { check } = require("express-validator");
const authMiddleware = require("./middleware/authMiddleware");

router.post("/registration", [
    check("email", "Поле email не может быть пустым").notEmpty(),
    check("name", "Поле name не может быть пустым").notEmpty(),
    check("password", "Пароль должен быть больше 4 символов").isLength({ min: 4 }),
], controller.registration);
router.post("/login", controller.login);
router.get("/userinfo", authMiddleware, controller.getUserInfo);


module.exports = router;
