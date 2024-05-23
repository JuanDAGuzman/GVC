const express = require("express");
const router = express.Router();
const pool = require("../db");

// Crear una nueva venta
router.post("/", async (req, res) => {
  const client = await pool.connect();
  try {
    const { cliente_id, asesor_id, fecha_venta, productos } = req.body;

    // Iniciar la transacción
    await client.query("BEGIN");

    // Insertar la venta
    const ventaResult = await client.query(
      "INSERT INTO Venta (cliente_id, asesor_id, fecha_venta) VALUES ($1, $2, $3) RETURNING venta_id",
      [cliente_id, asesor_id, fecha_venta]
    );
    const venta_id = ventaResult.rows[0].venta_id;

    // Insertar los productos en VentaProducto y calcular el total
    let total = 0;
    for (let producto of productos) {
      const { producto_id, cantidad, precio_unitario } = producto;
      await client.query(
        "INSERT INTO VentaProducto (venta_id, producto_id, cantidad, precio_unitario) VALUES ($1, $2, $3, $4)",
        [venta_id, producto_id, cantidad, precio_unitario]
      );
      total += cantidad * precio_unitario;
    }

    // Insertar la factura
    await client.query(
      "INSERT INTO Factura (venta_id, fecha_emision, total) VALUES ($1, $2, $3)",
      [venta_id, fecha_venta, total]
    );

    // Insertar la venta en la tabla VentaAsesor
    await client.query(
      "INSERT INTO VentaAsesor (venta_id, asesor_id) VALUES ($1, $2)",
      [venta_id, asesor_id]
    );

    const historialComprasResult = await client.query(
      "SELECT historial_compras FROM DetallesCliente WHERE cliente_id = $1",
      [cliente_id]
    );
    const historialComprasData =
      historialComprasResult.rows[0]?.historial_compras || "[]";
    const historialCompras = JSON.parse(historialComprasData);

    // Agregar la nueva venta al historial de compras
    const nuevaVenta = { venta_id, fecha_venta, total };
    historialCompras.push(nuevaVenta);

    // Actualizar el historial de compras del cliente
    await client.query(
      "UPDATE DetallesCliente SET historial_compras = $1 WHERE cliente_id = $2",
      [JSON.stringify(historialCompras), cliente_id]
    );

    // Finalizar la transacción
    await client.query("COMMIT");

    res.status(201).json({ message: "Venta realizada con éxito" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err.message);
    res.status(500).send("Server Error");
  } finally {
    client.release();
  }
});

// Obtener las ventas y el total por asesor
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        a.asesor_id,
        a.nombre AS nombre_asesor,
        COUNT(v.venta_id) AS ventas_realizadas,
        SUM(f.total) AS total_ventas
      FROM 
        Venta v
      INNER JOIN 
        Asesor a ON v.asesor_id = a.asesor_id
      INNER JOIN 
        Factura f ON v.venta_id = f.venta_id
      GROUP BY 
        a.asesor_id, a.nombre
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
