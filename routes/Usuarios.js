const express = require('express');
const router = express.Router();
var bd = require('./bd');
require('dotenv').config();

const multer = require('multer');
const { subirACloudinary } = require('./Cloudinary'); // ← desde routes/

const storage = multer.memoryStorage();
const upload = multer({ storage });


router.get('/CerrarSesion', function (req, res, next) {
  res.render('/');
 
});

router.get('/Registro', function (req, res, next) {
  res.render('Login');
  
});

router.get('/CargarIndex', function (req, res, next) {
  res.render('index');
  
});
 


router.get('/InicioPersona', function (req, res, next) {
  res.render('InicioDeAdministrativo');
  console.log(" Ingrese a Administrativo.");
});

//InicioPersona


router.get('/InicioAdministrador', function (req, res, next) {

  console.log("Ingrese a inicio de vendedor")
  const { ciudad, pais, precioMin, precioMax } = req.query;

  let filtroSQL = "WHERE Estado = 'venta'";
  let params = [];

  if (ciudad) { filtroSQL += " AND Ciudad LIKE ?"; params.push(`%${ciudad}%`); }
  if (pais)   { filtroSQL += " AND Pais LIKE ?";   params.push(`%${pais}%`); }
  if (precioMin) { filtroSQL += " AND Precio >= ?"; params.push(precioMin); }
  if (precioMax) { filtroSQL += " AND Precio <= ?"; params.push(precioMax); }

  const baseQuery = `
    SELECT c.*,
      (SELECT Imagen FROM CasaImagenes
       WHERE idCasaVenta = c.idCasaVenta
       ORDER BY idImagen ASC LIMIT 1) AS Imagen
    FROM CasasVentas c
  `;

  const sqlUltimas = `${baseQuery} WHERE c.Estado = 'venta' ORDER BY c.idCasaVenta DESC LIMIT 5`;
  const sqlTodas   = `${baseQuery} ${filtroSQL} ORDER BY c.idCasaVenta DESC`;

  // Imagen ya es URL de Cloudinary, solo asignarla directamente
  const procesar = lista =>
    lista.map(c => ({ ...c, ImagenBase64: c.Imagen || null }));

  bd.query(sqlUltimas, (err, ultimas) => {
    if (err) { console.error(err); return res.status(500).send("Error cargando últimas casas"); }

    bd.query(sqlTodas, params, (err, todas) => {
      if (err) { console.error(err); return res.status(500).send("Error cargando casas"); }

      const id = req.session.IdPersona;

     bd.query("CALL ObtenerPerfil(?)", [id], (err, resultsPerfil) => {

      let imagenUsuario = "";

        if (!err && resultsPerfil[0] && resultsPerfil[0].length > 0) {
          const data = resultsPerfil[0][0];
          imagenUsuario = data.Imagen || "";  // ← URL directa de Cloudinary
        }

        res.render('InicioDeAdministrativo', { // o 'InicioDeVendedor'
          title: "Bienes Raíces",
          ultimas: procesar(ultimas),
          casas: procesar(todas),
          ciudad, pais, precioMin, precioMax,
          imagenUsuario
        });
   
        res.render('InicioDeAdministrativo', {
          title: "Bienes Raíces",
          ultimas: procesar(ultimas),
          casas: procesar(todas),
          ciudad, pais, precioMin, precioMax,
          imagenUsuario
        });
      });
    });
  });
});


router.get('/InicioDeVendedor', function (req, res, next) {

  const { ciudad, pais, precioMin, precioMax } = req.query;

  let filtroSQL = "WHERE Estado = 'venta'";
  let params = [];

  if (ciudad) { filtroSQL += " AND Ciudad LIKE ?"; params.push(`%${ciudad}%`); }
  if (pais)   { filtroSQL += " AND Pais LIKE ?";   params.push(`%${pais}%`); }
  if (precioMin) { filtroSQL += " AND Precio >= ?"; params.push(precioMin); }
  if (precioMax) { filtroSQL += " AND Precio <= ?"; params.push(precioMax); }

  const baseQuery = `
    SELECT c.*,
      (SELECT Imagen FROM CasaImagenes
       WHERE idCasaVenta = c.idCasaVenta
       ORDER BY idImagen ASC LIMIT 1) AS Imagen
    FROM CasasVentas c
  `;

  const sqlUltimas = `${baseQuery} WHERE c.Estado = 'venta' ORDER BY c.idCasaVenta DESC LIMIT 5`;
  const sqlTodas   = `${baseQuery} ${filtroSQL} ORDER BY c.idCasaVenta DESC`;

  // Imagen ya es URL de Cloudinary, solo asignarla directamente
  const procesar = lista =>
    lista.map(c => ({ ...c, ImagenBase64: c.Imagen || null }));

  bd.query(sqlUltimas, (err, ultimas) => {
    if (err) { console.error(err); return res.status(500).send("Error cargando últimas casas"); }

    bd.query(sqlTodas, params, (err, todas) => {
      if (err) { console.error(err); return res.status(500).send("Error cargando casas"); }

      const id = req.session.IdPersona;

      bd.query("CALL ObtenerPerfil(?)", [id], (err, resultsPerfil) => {

      let imagenUsuario = "";

        if (!err && resultsPerfil[0] && resultsPerfil[0].length > 0) {
          const data = resultsPerfil[0][0];
          imagenUsuario = data.Imagen || "";  // ← URL directa de Cloudinary
        }

        res.render('InicioDeAdministrativo', { // o 'InicioDeVendedor'
          title: "Bienes Raíces",
          ultimas: procesar(ultimas),
          casas: procesar(todas),
          ciudad, pais, precioMin, precioMax,
          imagenUsuario
        });
    });

        res.render('InicioDeVendedor', {
          title: "Bienes Raíces",
          ultimas: procesar(ultimas),
          casas: procesar(todas),
          ciudad, pais, precioMin, precioMax,
          imagenUsuario
        });
      });
    });
  
});

router.get('/Error', function (req, res, next) {
  res.render('error');

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

    };

   

    // Llamada al procedimiento almacenado
    const sql = 'CALL sp_InsertUsuario(?, ?, ?, ?, ?, ?, ?, ?, ?)';

    bd.query(sql, [
      RegistroPersonas.Identificacion,
      RegistroPersonas.Nombre,
      RegistroPersonas.Apellido1,
      RegistroPersonas.Apellido2,
      RegistroPersonas.Edad,
      RegistroPersonas.Correo,
      RegistroPersonas.Usuario,
      RegistroPersonas.Contrasena,
      RegistroPersonas.Telefono
   
    ], function (error, resultado) {
      if (error) {
        console.error(' Error al ejecutar el procedimiento:', error);
        return res.status(500).send('Error al registrar la persona.');
      }

      //console.log('Persona registrada correctamente:', resultado);
      res.status(200).send('Persona registrada exitosamente.');

    });

  } catch (err) {
    console.error('Error inesperado:', err);
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

    console.log("Resultado:", resultado); // ← log temporal

    if (resultado === 'Usuario y contraseña correctos') {

      // Guardar datos en sesión
      req.session.IdPersona = IdPersona;
      req.session.IdRol = IdRol;
      req.session.NombreRol = NombreRol;
      req.session.usuario = { rol: NombreRol }; // ← agregado

      console.log(`Inicio de sesión exitoso: ID=${IdPersona}, Rol=${NombreRol}`);

      req.session.save(function (err) {

        if (err) {
          console.error("Error al guardar la sesión:", err);
          return res.redirect('/Usuarios/Error');
        }

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

router.get('/CargarPerfil', function (req, res) {

  const id = req.session.IdPersona;

  bd.query("CALL ObtenerPerfil(?)", [id], function (err, results) {

    if (err) {
      console.log("Error en query:", err);
      return res.send("Error al cargar perfil");
    }

    let agent = {
      idPersona: id,
      nombre:      req.session.Nombre    || "",
      apellido:    req.session.Apellido  || "",
      email:       req.session.Correo    || "",
      telefono:    req.session.Telefono  || "",
      descripcion: "",
      experiencia: [],
      redes:       "",
      imagen:      ""
    };

    if (results[0] && results[0].length > 0) {
      const data = results[0][0];

      agent.nombre      = data.Nombre;
      agent.apellido    = data.Apellido1;
      agent.email       = data.Correo;
      agent.telefono    = data.Telefono;
      agent.descripcion = data.SobreMi;
      agent.experiencia = data.Experiencia ? data.Experiencia.split(',') : [];
      agent.redes       = data.Redes;
      agent.imagen      = data.Imagen || ""; // ← URL directa de Cloudinary
    }

    res.render('Perfil', { agent, propiedades: [] });
  });
});


router.post('/GuardarPerfil', upload.single('imagen'), async function (req, res) {

  const id = req.session.IdPersona;
  const { SobreMi, Experiencia, Redes } = req.body;

  try {
    // Subir imagen a Cloudinary solo si se envió una nueva
    let imagenURL = null;
    if (req.file) {
      imagenURL = await subirACloudinary(req.file.buffer, 'perfiles');
    }

    bd.query(
      "CALL GuardarPerfil(?, ?, ?, ?, ?)",
      [id, SobreMi, Experiencia, Redes, imagenURL],
      function (error) {
        if (error) {
          console.log(error);
          return res.send("Error al guardar perfil");
        }
        res.redirect('/Usuarios/CargarPerfil');
      }
    );

  } catch (err) {
    console.error("Error subiendo imagen a Cloudinary:", err);
    res.status(500).send("Error al guardar perfil");
  }
});


router.get('/imagen/:id', function (req, res) {
  res.redirect('/img/user.png');
});






router.get('/Usuarios', (req, res) => {
  bd.query('SELECT * FROM Persona', (err, results) => {
    if (err) throw err;

    res.render('Personas', {
      Usuarios: results
    });
  });
});

router.get('/editar/:id', (req, res) => {

  const { id } = req.params;

  bd.query('CALL sp_buscar_casa(?)', [id], (err, results) => {

    if (err) {
      console.error(err);
      return res.status(500).send('Error al buscar la casa');
    }

    const casa = results[0][0]; 

    res.render('editar', {
      Casa: casa
    });
  });
});

router.post('/Usuarios/eliminar/:id', (req, res) => {
  const { id } = req.params;

  bd.query('DELETE FROM Persona WHERE idPersona=?', [id], (err) => {
    if (err) throw err;

    res.redirect('/Usuarios?msg=eliminado');
  });
});



router.post('/Usuarios/crear', (req, res) => {
  console.log(req.body); 

  const {
    Identificacion,
    Nombre,
    Apellido1,
    Apellido2,
    Edad,
    Correo,
    Usuario,
    Contraseña,
    Telefono,
    IdRol
  } = req.body;

  bd.query(
    `INSERT INTO Persona 
    (Identificacion, Nombre, Apellido1, Apellido2, Edad, Correo, Usuario, Contraseña, Telefono, IdRol)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [Identificacion, Nombre, Apellido1, Apellido2, Edad, Correo, Usuario, Contraseña, Telefono, IdRol],
    (err) => {
      if (err) {
        console.log(err); 
        return res.send("Error al insertar");
      }

      res.redirect('/Usuarios');
    }
  );
});

router.post('/editarPersona/:id', (req, res) => {
  const { id } = req.params;
  const { Nombre, Apellido1, Apellido2, Correo, Telefono } = req.body;

  bd.query(
    'UPDATE Persona SET Nombre=?, Apellido1=?, Apellido2=?, Correo=?, Telefono=? WHERE idPersona=?',
    [Nombre, Apellido1, Apellido2, Correo, Telefono, id],
    () => {
      res.redirect('/usuarios');
    }
  );
});




module.exports = router;