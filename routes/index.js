var express = require('express');
var router = express.Router();
var bd = require('./bd');

router.get('/', function(req, res) {

  const sql = "SELECT * FROM CasasVentas WHERE Estado = 'venta'";

  bd.query(sql, (err, casas) => {
    if (err) {
      console.error("Error consultando BD:", err);
      return res.status(500).send("Error en el servidor");
    }

    // Convertir BLOB a Base64
    casas = casas.map(casa => {
      if (casa.Imagen) {
        casa.ImagenBase64 = Buffer.from(casa.Imagen).toString("base64");
      } else {
        casa.ImagenBase64 = null;
      }
      return casa;
    });

    res.render('index', {
      title: "Bienes Raíces",
      casas
    });
  });

});

module.exports = router;
