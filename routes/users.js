var express = require('express');
var router = express.Router();
var bd = require('./bd'); // conexión MySQL

/* GET home page. */
router.get('/', function(req, res) {

  const sql = "SELECT * FROM CasasVentas WHERE Estado = 'En venta'";

  bd.query(sql, (err, casas) => {
    if (err) {
      console.error("Error consultando BD:", err);
      return res.status(500).send("Error en el servidor");
    }

    res.render('index', {
      title: 'Bienes Raíces',
      casas: casas // <-- se envía a index.pug
    });
  });

});

module.exports = router;
