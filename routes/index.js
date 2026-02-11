var express = require('express');
var router = express.Router();
var bd = require('./bd');

// Página Principal
router.get('/', function (req, res) {

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

  // 🔥 Trae UNA imagen (BLOB) por casa
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

  // Últimas 5 casas
  bd.query(sqlUltimas, (err, ultimas) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error cargando últimas casas");
    }

    // Todas las casas
    bd.query(sqlTodas, params, (err, todas) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Error cargando casas");
      }

      // 🔥 Convertir BLOB a Base64 correctamente
      const procesar = lista =>
        lista.map(c => {

          let imagenBase64 = null;

          if (c.Imagen && Buffer.isBuffer(c.Imagen)) {
            const base64 = c.Imagen.toString('base64');
            imagenBase64 = `data:image/jpeg;base64,${base64}`;
          }

          return {
            ...c,
            ImagenBase64: imagenBase64
          };
        });

      res.render('index', {
        title: "Bienes Raíces",
        ultimas: procesar(ultimas),
        casas: procesar(todas)
      });
    });
  });
});

module.exports = router;
