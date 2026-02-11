const express = require('express');
const router = express.Router();
var bd = require('./bd')
require('dotenv').config(); // Cargar variables de entorno

//Manejo de insetar usuario 

router.get('/Registro', function (req, res, next) {
  res.render('Login');
  console.log("Ingrese a login.");
});

router.get('/CargarIndex', function (req, res, next) {
  res.render('index');
  console.log("Ingrese a index.");
});
 


router.get('/InicioAdministrador', function (req, res, next) {
  res.render('InicioDeAdministrativo');
  console.log(" Ingrese a Administrativo.");
});



router.get('/InicioPersona', function (req, res, next) {

 

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



router.get('/InicioDeVendedor', function (req, res, next) {

  // Filtros recibidos del usuario

  console.log("Ingrese a inicio de vendedor")
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
      return res.status(500).send('Error en el servidor');
    }

    if (!rows || !rows[0] || !rows[0][0]) {
      console.error("Resultado inesperado del procedimiento almacenado");
      return res.redirect('/Usuarios/Error');
    }

    const resultado = rows[0][0].Resultado;
    const IdPersona = rows[0][0].IdPersona;
    const IdRol = rows[0][0].IdRol;
    const NombreRol = rows[0][0].NombreRol;

    if (resultado === 'Usuario y contraseña correctos') {

      // Guardar datos en sesión
      req.session.IdPersona = IdPersona;
      req.session.IdRol = IdRol;
      req.session.NombreRol = NombreRol;

      console.log(`Inicio de sesión exitoso: ID=${IdPersona}, Rol=${NombreRol}`);

      // 🔥 IMPORTANTE: esperar que la sesión se guarde
      req.session.save(function (err) {

        if (err) {
          console.error("Error al guardar la sesión:", err);
          return res.redirect('/Usuarios/Error');
        }

        // Redirigir según rol
        switch (NombreRol) {
          case 'Administrador':
            return res.redirect('/Usuarios/InicioAdministrador');

          case 'Vendedor':
            return res.redirect('/Usuarios/InicioDeVendedor');

          case 'Persona':
            return res.redirect('/Usuarios/InicioPersona');

          default:
            return res.redirect('/Usuarios/Registro');
        }

      });

    } else {
      return res.redirect('/Usuarios/Error');
    }

  });

});


module.exports = router;