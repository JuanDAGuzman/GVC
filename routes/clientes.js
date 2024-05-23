const express = require("express");
const router = express.Router();
const pool = require("../db");

// Obtener todos los clientes
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM Cliente");
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Actualizar datos de un cliente
// Actualizar datos de un cliente
router.patch("/:cliente_id", async (req, res) => {
  try {
    const { cliente_id } = req.params;
    const { celular, direccion, preferencias, estado_id } = req.body;

    // Verificar si el cliente existe
    const clienteCheck = await pool.query(
      "SELECT * FROM Cliente WHERE cliente_id = $1",
      [cliente_id]
    );
    if (clienteCheck.rows.length === 0) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }

    // Iniciar la transacción
    const client = await pool.connect();
    await client.query("BEGIN");

    // Actualizar los datos del cliente
    if (celular) {
      await client.query(
        "UPDATE Cliente SET telefono = $1 WHERE cliente_id = $2",
        [celular, cliente_id]
      );
    }
    if (direccion) {
      await client.query(
        "UPDATE Cliente SET direccion = $1 WHERE cliente_id = $2",
        [direccion, cliente_id]
      );
    }
    if (preferencias) {
      await client.query(
        "UPDATE DetallesCliente SET preferencias = $1 WHERE cliente_id = $2",
        [preferencias, cliente_id]
      );
    }
    // Aquí se agrega la actualización para el campo estado_id
    if (estado_id) {
      await client.query(
        "UPDATE Cliente SET estado_id = $1 WHERE cliente_id = $2",
        [estado_id, cliente_id]
      );
    }

    // Finalizar la transacción
    await client.query("COMMIT");
    client.release();

    res.json({ message: "Datos del cliente actualizados con éxito" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Obtener las facturas de un cliente específico
router.get("/:cliente_id/facturas", async (req, res) => {
    try {
      const { cliente_id } = req.params;
  
      // Consultar las facturas del cliente
      const result = await pool.query(
        `
          SELECT 
            f.factura_id,
            f.fecha_emision,
            f.total,
            c.nombre AS nombre_cliente,
            json_agg(json_build_object(
              'nombre_producto', p.nombre,
              'precio_unitario', vp.precio_unitario,
              'cantidad', vp.cantidad
            )) AS productos
          FROM 
            Factura f
          JOIN 
            Venta v ON f.venta_id = v.venta_id
          JOIN 
            Cliente c ON v.cliente_id = c.cliente_id
          JOIN 
            VentaProducto vp ON v.venta_id = vp.venta_id
          JOIN 
            ProductoServicio p ON vp.producto_id = p.producto_id
          WHERE 
            v.cliente_id = $1
          GROUP BY 
            f.factura_id, c.nombre;
        `,
        [cliente_id]
      );
  
      // Verificar si se encontraron facturas para el cliente
      if (result.rows.length === 0) {
        return res
          .status(404)
          .json({ message: "No se encontraron facturas para este cliente" });
      }
  
      // Devolver las facturas del cliente con detalles adicionales
      res.json(result.rows);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  });

  
  
// Crear un nuevo cliente
router.post("/", async (req, res) => {
  try {
    const { nombre, direccion, telefono, estado_id, preferencias } = req.body;

    // Verificar si el estado_id existe
    const estadoCheck = await pool.query(
      "SELECT * FROM EstadoCliente WHERE estado_id = $1",
      [estado_id]
    );
    if (estadoCheck.rows.length === 0) {
      return res.status(400).json({ error: "Estado no válido" });
    }

    // Iniciar la transacción
    const client = await pool.connect();
    await client.query("BEGIN");

    // Insertar el nuevo cliente
    const result = await client.query(
      "INSERT INTO Cliente (nombre, direccion, telefono, estado_id) VALUES ($1, $2, $3, $4) RETURNING *",
      [nombre, direccion, telefono, estado_id]
    );
    const cliente_id = result.rows[0].cliente_id;

    // Si se proporcionaron preferencias de productos, actualizar el campo en DetallesCliente
    if (preferencias) {
      await client.query(
        "INSERT INTO DetallesCliente (cliente_id, preferencias) VALUES ($1, $2)",
        [cliente_id, preferencias]
      );
    }

    // Finalizar la transacción
    await client.query("COMMIT");
    client.release();

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Obtener las preferencias de productos de un cliente específico
router.get("/:cliente_id/preferencias-productos", async (req, res) => {
  try {
    const { cliente_id } = req.params;

    // Obtener las preferencias de productos del cliente
    const result = await pool.query(
      "SELECT preferencias FROM DetallesCliente WHERE cliente_id = $1",
      [cliente_id]
    );

    // Verificar si se encontró el cliente
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }

    // Devolver las preferencias de productos del cliente
    const preferenciasProductos = result.rows[0].preferencias || "";
    res.json(preferenciasProductos);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Obtener el historial de compras de un cliente específico
router.get("/:cliente_id/historial-compras", async (req, res) => {
  try {
    const { cliente_id } = req.params;

    // Obtener el historial de compras del cliente
    const result = await pool.query(
      "SELECT historial_compras FROM DetallesCliente WHERE cliente_id = $1",
      [cliente_id]
    );

    // Verificar si se encontró el cliente
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }

    // Devolver el historial de compras del cliente en un formato legible
    const historialCompras = result.rows[0].historial_compras || [];
    const formattedHistorialCompras = JSON.parse(historialCompras).map(
      (venta) => ({
        venta_id: venta.venta_id,
        fecha_venta: new Date(venta.fecha_venta).toLocaleDateString(),
        total: venta.total,
      })
    );
    res.json(formattedHistorialCompras);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
