const express = require("express");
const router = express.Router();
const pool = require("../db");

// Obtener todos los productos
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM ProductoServicio");
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Crear un nuevo producto
router.post("/", async (req, res) => {
  try {
    const { nombre, descripcion, precio } = req.body;
    const result = await pool.query(
      "INSERT INTO ProductoServicio (nombre, descripcion, precio) VALUES ($1, $2, $3) RETURNING *",
      [nombre, descripcion, precio]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Actualizar un producto existente
router.patch("/:producto_id", async (req, res) => {
  try {
    const { producto_id } = req.params;
    const { nombre, descripcion, precio } = req.body;

    // Verificar si el producto existe
    const productoCheck = await pool.query(
      "SELECT * FROM ProductoServicio WHERE producto_id = $1",
      [producto_id]
    );
    if (productoCheck.rows.length === 0) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    // Iniciar la transacción
    const client = await pool.connect();
    await client.query("BEGIN");

    // Actualizar los datos del producto
    if (nombre) {
      await client.query(
        "UPDATE ProductoServicio SET nombre = $1 WHERE producto_id = $2",
        [nombre, producto_id]
      );
    }
    if (descripcion) {
      await client.query(
        "UPDATE ProductoServicio SET descripcion = $1 WHERE producto_id = $2",
        [descripcion, producto_id]
      );
    }
    if (precio) {
      await client.query(
        "UPDATE ProductoServicio SET precio = $1 WHERE producto_id = $2",
        [precio, producto_id]
      );
    }

    // Finalizar la transacción
    await client.query("COMMIT");
    client.release();

    res.json({ message: "Datos del producto actualizados con éxito" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
