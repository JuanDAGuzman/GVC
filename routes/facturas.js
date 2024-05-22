const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        f.factura_id,
        v.venta_id,
        c.cliente_id,
        c.nombre AS nombre_cliente,
        c.direccion AS direccion_cliente,
        c.telefono AS telefono_cliente,
        a.asesor_id,
        a.nombre AS nombre_asesor,
        f.total AS total_factura,
        json_agg(json_build_object(
          'producto_id', p.producto_id,
          'nombre_producto', p.nombre,
          'descripcion_producto', p.descripcion,
          'precio_unitario', vp.precio_unitario,
          'cantidad', vp.cantidad
        )) AS productos
      FROM 
        Factura f
      INNER JOIN 
        Venta v ON f.venta_id = v.venta_id
      INNER JOIN 
        Cliente c ON v.cliente_id = c.cliente_id
      INNER JOIN 
        Asesor a ON v.asesor_id = a.asesor_id
      INNER JOIN 
        VentaProducto vp ON v.venta_id = vp.venta_id
      INNER JOIN 
        ProductoServicio p ON vp.producto_id = p.producto_id
      GROUP BY 
        f.factura_id, v.venta_id, c.cliente_id, a.asesor_id
      ORDER BY 
        f.factura_id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
