var express = require('express');
var router = express.Router();
var bd = require('./bd');

// Página Principal
router.get('/', function(req, res) {

  // Filtros recibidos del usuario
  const { ciudad, pais, precioMin, precioMax } = req.query;

  let filtroSQL = "WHERE Estado = 'venta'";
  let params = [];

  if (ciudad) {
    filtroSQL += " AND Ciudad LIKE ?";
    params.push(`%${ciudad}%`);
  }

  if (pais) {
    filtroSQL += " AND Pais LIKE ?";
    params.push(`%${pais}%`);
  }

  if (precioMin) {
    filtroSQL += " AND Precio >= ?";
    params.push(precioMin);
  }

  if (precioMax) {
    filtroSQL += " AND Precio <= ?";
    params.push(precioMax);
  }

  const sqlUltimas = `
    SELECT * FROM CasasVentas 
    WHERE Estado = 'venta'
    ORDER BY idCasaVenta DESC
    LIMIT 5
  `;

  const sqlTodas = `
    SELECT * FROM CasasVentas 
    ${filtroSQL}
    ORDER BY idCasaVenta DESC
  `;

  // Consultar últimas 5
  bd.query(sqlUltimas, (err, ultimas) => {
    if (err) return res.status(500).send("Error cargando últimas casas");

    // Consultar todas
    bd.query(sqlTodas, params, (err, todas) => {
      if (err) return res.status(500).send("Error cargando casas");

      // Convertir BLOB a Base64
      const procesar = lista =>
        lista.map(c => ({
          ...c,
          ImagenBase64: c.Imagen ? Buffer.from(c.Imagen).toString("base64") : null
        }));

      res.render('index', {
        title: "Bienes Raíces",
        ultimas: procesar(ultimas),
        casas: procesar(todas)
      });
    });
  });

});

module.exports = router;
