const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      error: "Debes ingresar usuario y contraseña."
    });
  }

  try {
    const [rows] = await db.query(
      "SELECT * FROM admins WHERE username = ?",
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        error: "Usuario o contraseña incorrectos."
      });
    }

    const admin = rows[0];

    const isMatch = await bcrypt.compare(
      password,
      admin.password_hash
    );

    if (!isMatch) {
      return res.status(401).json({
        error: "Usuario o contraseña incorrectos."
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET no está definido en el archivo .env");

      return res.status(500).json({
        error: "Error de configuración del servidor."
      });
    }

    const token = jwt.sign(
      {
        id: admin.id,
        username: admin.username
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d"
      }
    );

    return res.json({
      message: "Login exitoso",
      token
    });
  } catch (error) {
    console.error("Error en login:", error);

    return res.status(500).json({
      error: "Error interno del servidor."
    });
  }
};