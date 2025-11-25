const express = require('express');
const router = express.Router();
var bd = require('./bd')
require('dotenv').config(); // Cargar variables de entorno

//Manejo de insetar usuario 

router.get('/Registro', function (req, res, next) {
  res.render('Login');
  console.log("Ingrese a login.");
});


router.get('/InicioPersona', function (req, res, next) {
  res.render('InicioDePersona');
  console.log("Ingreseainicioperso.");
});



router.get('/InicioAdministrador', function (req, res, next) {
  res.render('InicioDeAdministrativo');
  console.log(" Ingrese a Administrativo.");
});


router.get('/InicioDeVendedor', function (req, res, next) {
  res.render('InicioDeVendedor');
  console.log(" Ingrese a Inicio de Vendedor.");
});

router.get('/Error', function (req, res, next) {
  res.render('error');
  console.log("Ingrese a error.");
});




router.post('/RegistroPersonas', async function (req, res, next) {
  try {
    const RegistroPersonas = { 
      Identificacion: req.body.identificacion,
      Nombre: req.body.nombre, 
      Apellido1: req.body.apellido1,
      Apellido2: req.body.apellido2,
      Edad: req.body.edad, 
      Correo: req.body.correo, 
      Usuario: req.body.usuario,
      Contrasena: req.body.contrasena,
      Telefono: req.body.telefono, 
      PalabraClave: req.body.palabraClave
    };

   

    // Llamada al procedimiento almacenado
    const sql = 'CALL sp_InsertUsuario(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

    bd.query(sql, [
      RegistroPersonas.Identificacion,
      RegistroPersonas.Nombre,
      RegistroPersonas.Apellido1,
      RegistroPersonas.Apellido2,
      RegistroPersonas.Edad,
      RegistroPersonas.Correo,
      RegistroPersonas.Usuario,
      RegistroPersonas.Contrasena,
      RegistroPersonas.Telefono,
      RegistroPersonas.PalabraClave
    ], function (error, resultado) {
      if (error) {
        console.error('❌ Error al ejecutar el procedimiento:', error);
        return res.status(500).send('Error al registrar la persona.');
      }

      console.log('✅ Persona registrada correctamente:', resultado);
      res.status(200).send('Persona registrada exitosamente.');
    });

  } catch (err) {
    console.error('❌ Error inesperado:', err);
    res.status(500).send('Error interno del servidor.');
  }
});

//Manejo de de inicio se sesion 


router.post('/InicioSesion', function (req, res, next) {
  const usuario = req.body.usuario;
  const contrasena = req.body.contrasena;

  bd.query('CALL ObtenerTipoUsuario(?, ?)', [usuario, contrasena], function (error, rows) {
    if (error) {
      console.error('Error al ejecutar el procedimiento almacenado:', error);
      res.status(500).send('Error en el servidor');
      return;
    }

    if (!rows || !rows[0] || !rows[0][0]) {
      console.error("Resultado inesperado del procedimiento almacenado");
      res.redirect('/Usuarios/Error');
      return;
    }

    const resultado = rows[0][0].Resultado;
    const IdPersona = rows[0][0].IdPersona;
    const IdRol = rows[0][0].IdRol;
    const NombreRol = rows[0][0].NombreRol;

    if (resultado === 'Usuario y contraseña correctos') {
      req.session.IdPersona = IdPersona;
      req.session.IdRol = IdRol;
      req.session.NombreRol = NombreRol;

      console.log(`Inicio de sesión exitoso: ID=${IdPersona}, Rol=${NombreRol}`);

      switch (NombreRol) {
        case 'Administrador':
          res.redirect('/Usuarios/InicioAdministrador');
          break;
        case 'Vendedor':
          res.redirect('/Usuarios/InicioDeVendedor');
          break;
        case 'Persona':
          res.redirect('/Usuarios/InicioPersona');
          break;
        default:
          res.redirect('/Usuarios/Registro');
          break;
      }
    } else {
      res.redirect('/Usuarios/Error');
    }
  });
});


module.exports = router;