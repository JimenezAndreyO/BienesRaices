const express = require('express');
const router = express.Router();
const conexion = require('./bd');
require('dotenv').config(); // Cargar variables de entorno

// Renderizar la vista Contacto
router.get('/altatiket', function (req, res, next) {
  res.render('Contacto');
  console.log("Ingrese a altatiket");
});

// Manejar la solicitud de registro
router.post('/altatiket', async function (req, res, next) {
  console.log("Ingrese a tiket");

  const RegistroTiket = {
    Nombre: req.body.Nombre,
    Comentario: req.body.Nota
  };

  console.log(RegistroTiket);

  try {
    const [results] = await conexion.promise().execute(
      'INSERT INTO Reseña (Nombre, Comentario) VALUES (?, ?)',
      [RegistroTiket.Nombre, RegistroTiket.Comentario]
    );

    res.render('mensajepersonas', { mensaje: 'Tiket agregado correctamente' });
  } catch (error) {
    console.error('❌ Error al insertar en MySQL:', error.message);
    res.render('mensajepersonas', { mensaje: 'Error al agregar el tiket' });
  }
});


module.exports = router;