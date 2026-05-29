var express = require('express');
var router = express.Router();
var bd = require('./bd');

// Página Principal - SIN verificación de sesión
router.get('/', function (req, res) {

  const usuario = req.session.usuario || null;
  const { ciudad, pais, precioMin, precioMax } = req.query;

  let filtroSQL = "WHERE c.Estado = 'venta'";
  let params = [];

  if (ciudad) {
    filtroSQL += " AND c.Ciudad LIKE ?";
    params.push(`%${ciudad}%`);
  }
  if (pais) {
    filtroSQL += " AND c.Pais LIKE ?";
    params.push(`%${pais}%`);
  }
  if (precioMin) {
    filtroSQL += " AND c.Precio >= ?";
    params.push(precioMin);
  }
  if (precioMax) {
    filtroSQL += " AND c.Precio <= ?";
    params.push(precioMax);
  }

  const baseQuery = `
    SELECT 
      c.*,
      (
        SELECT Imagen
        FROM CasaImagenes
        WHERE idCasaVenta = c.idCasaVenta
        ORDER BY idImagen ASC
        LIMIT 1
      ) AS Imagen
    FROM CasasVentas c
  `;

  const sqlUltimas = `
    ${baseQuery}
    WHERE c.Estado = 'venta'
    ORDER BY c.idCasaVenta DESC
    LIMIT 5
  `;

  const sqlTodas = `
    ${baseQuery}
    ${filtroSQL}
    ORDER BY c.idCasaVenta DESC
  `;

  bd.query(sqlUltimas, (err, ultimas) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error cargando últimas casas");
    }

    bd.query(sqlTodas, params, (err, todas) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Error cargando casas");
      }

      // Imagen ya es URL directa, solo asignarla
      const procesar = lista =>
        lista.map(c => ({
          ...c,
          ImagenBase64: c.Imagen || null  
        }));

      res.render('index', {
        title: "Bienes Raíces",
        ultimas: procesar(ultimas),
        casas: procesar(todas),
        usuario
      });
    });
  });
});

module.exports = router;