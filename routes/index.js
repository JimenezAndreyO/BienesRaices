var express = require('express');
var router = express.Router();
var bd = require('./bd');

// Middleware para verificar sesión
function verificarSesion(req, res, next) {
  if (!req.session.usuario) {
    return res.redirect('/Login');
  }
  next();
}

// Página Principal - protegida por sesión
router.get('/', verificarSesion, function (req, res) {

  const usuario = req.session.usuario;

  // Redirigir según rol
  if (usuario.rol === 'admin') {
    return res.redirect('/dashboard');
  }

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

      const procesar = lista =>
        lista.map(c => {
          let imagenBase64 = null;
          if (c.Imagen && Buffer.isBuffer(c.Imagen)) {
            imagenBase64 = `data:image/jpeg;base64,${c.Imagen.toString('base64')}`;
          }
          return { ...c, ImagenBase64: imagenBase64 };
        });

      res.render('index', {
        title: "Bienes Raíces",
        ultimas: procesar(ultimas),
        casas: procesar(todas),
        usuario: usuario // Pasar usuario al jade
      });
    });
  });
});

module.exports = router;