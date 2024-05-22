const express = require('express');
const router = express.Router();

const clientesRoutes = require('./clientes');
const ventasRoutes = require('./ventas');
const asesoresRoutes = require('./asesores');
const facturasRoutes = require('./facturas');
const productosRoutes = require('./productos');
const estadoClienteRoutes = require('./estados'); // Nueva línea

router.use('/clientes', clientesRoutes);
router.use('/ventas', ventasRoutes);
router.use('/asesores', asesoresRoutes);
router.use('/facturas', facturasRoutes);
router.use('/productos', productosRoutes);
router.use('/estados', estadoClienteRoutes); // Nueva línea

module.exports = router;
