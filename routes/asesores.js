const express = require('express');
const router = express.Router();
const pool = require('../db');

// Obtener todos los asesores
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM Asesor");
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Crear un nuevo asesor
router.post("/", async (req, res) => {
    try {
      const { nombre } = req.body;
      const result = await pool.query(
        "INSERT INTO Asesor (nombre) VALUES ($1) RETURNING *",
        [nombre]
      );
      const newAsesor = result.rows[0];
      res.json({
        message: "ASIGNA ESTE ID A TU ASESOR PARA GENERAR VENTAS",
        asesor: newAsesor
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  });

module.exports = router;
