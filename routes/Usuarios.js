const express = require('express');
const router = express.Router();
var bd = require('./bd')

var multer = require('multer');
var upload = multer();

require('dotenv').config(); // Cargar variables de entorno

//Manejo de insetar usuario 



router.get('/CerrarSesion', function (req, res, next) {
  res.render('/');
  console.log("Ingrese a login.");
});

router.get('/Registro', function (req, res, next) {
  res.render('Login');
  console.log("Ingrese a login.");
});

router.get('/CargarIndex', function (req, res, next) {
  res.render('index');
  console.log("Ingrese a index.");
});
 


router.get('/InicioPersona', function (req, res, next) {
  res.render('InicioDeAdministrativo');
  console.log(" Ingrese a Administrativo.");
});

//InicioPersona



router.get('/InicioAdministrador', function (req, res, next) {

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

      // ================= 🔥 NUEVO: IMAGEN DEL USUARIO =================
      const id = req.session.IdPersona;

      bd.query("CALL ObtenerPerfil(?)", [id], (err, resultsPerfil) => {

        let imagenUsuario = "";

        if (!err && resultsPerfil[0] && resultsPerfil[0].length > 0) {
          const data = resultsPerfil[0][0];

          if (data.Imagen) {
            if (Buffer.isBuffer(data.Imagen)) {
              imagenUsuario = 'data:image/jpeg;base64,' + data.Imagen.toString('base64');
            } else if (typeof data.Imagen === 'string') {
              if (data.Imagen.startsWith('data:image')) {
                imagenUsuario = data.Imagen;
              } else {
                imagenUsuario = 'data:image/jpeg;base64,' + data.Imagen;
              }
            }
          }
        }

        // ================= RENDER =================
        res.render('InicioDeAdministrativo', {
          title: "Bienes Raíces",
          ultimas: procesar(ultimas),
          casas: procesar(todas),
          ciudad,
          pais,
          precioMin,
          precioMax,
          imagenUsuario 
        });

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

      // ================= 🔥 NUEVO: IMAGEN DEL USUARIO =================
      const id = req.session.IdPersona;

      bd.query("CALL ObtenerPerfil(?)", [id], (err, resultsPerfil) => {

        let imagenUsuario = "";

        if (!err && resultsPerfil[0] && resultsPerfil[0].length > 0) {
          const data = resultsPerfil[0][0];

          if (data.Imagen) {
            if (Buffer.isBuffer(data.Imagen)) {
              imagenUsuario = 'data:image/jpeg;base64,' + data.Imagen.toString('base64');
            } else if (typeof data.Imagen === 'string') {
              if (data.Imagen.startsWith('data:image')) {
                imagenUsuario = data.Imagen;
              } else {
                imagenUsuario = 'data:image/jpeg;base64,' + data.Imagen;
              }
            }
          }
        }

        // ================= RENDER =================
        res.render('InicioDeVendedor', {
          title: "Bienes Raíces",
          ultimas: procesar(ultimas),
          casas: procesar(todas),
          ciudad,
          pais,
          precioMin,
          precioMax,
          imagenUsuario 
        });

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

router.get('/CargarPerfil', function (req, res) {

  const id = req.session.IdPersona;

  // 🔍 Ver qué ID viene en la sesión
  console.log("ID de sesión:", id);
  console.log("Cookies:", req.headers.cookie);
console.log("SessionID:", req.sessionID);
console.log("Session completa:", req.session);

  bd.query("CALL ObtenerPerfil(?)", [id], function (err, results) {

    if (err) {
      console.log("Error en query:", err);
      return res.send("Error al cargar perfil");
    }

    // 🔍 Ver qué devuelve MySQL
    console.log("Resultados del SP:", results);
let agent = {
  idPersona: id, 
  nombre: req.session.Nombre || "",
  apellido: req.session.Apellido || "",
  email: req.session.Correo || "",
  telefono: req.session.Telefono || "",
  descripcion: "",
  experiencia: [],
  redes: "",
  imagen: ""
};

    // 🔍 Validar estructura
if (results[0] && results[0].length > 0) {

  const data = results[0][0];

  agent.nombre = data.Nombre;
  agent.apellido = data.Apellido1;
  agent.email = data.Correo;
  agent.telefono = data.Telefono;

  agent.descripcion = data.SobreMi;
  agent.experiencia = data.Experiencia ? data.Experiencia.split(',') : [];
  agent.redes = data.Redes;
  if (data.Imagen) {

  // 🔥 Si es Buffer → convertir
  if (Buffer.isBuffer(data.Imagen)) {
    agent.imagen = 'data:image/jpeg;base64,' + data.Imagen.toString('base64');

  } else if (typeof data.Imagen === 'string') {

    // 🔥 Si ya es string
    if (data.Imagen.startsWith('data:image')) {
      agent.imagen = data.Imagen;
    } else {
      agent.imagen = 'data:image/jpeg;base64,' + data.Imagen;
    }

  }


  }
    } else {
      console.log("⚠️ No se encontraron resultados para ese ID");
    }

    res.render('Perfil', { agent, propiedades: [] });

  });

});
router.post('/GuardarPerfil', upload.single('imagen'), function (req, res) {

  const id = req.session.IdPersona;
  const { SobreMi, Experiencia, Redes } = req.body;
  const imagen = req.file ? req.file.buffer : null;

  bd.query(
    "CALL GuardarPerfil(?, ?, ?, ?, ?)",
    [id, SobreMi, Experiencia, Redes, imagen],
    function (error, results) {

      if (error) {
        console.log(error);
        return res.send("Error al guardar perfil");
      }

      res.redirect('/Usuarios/CargarPerfil');
    }
  );

});

router.get('/imagen/:id', function (req, res) {

  const id = req.params.id;

  bd.query(
    "SELECT Imagen FROM informacion WHERE idPersona = ?",
    [id],
    function (err, results) {

      if (err) {
        console.log(err);
        return res.send("Error al cargar imagen");
      }

      if (results.length > 0 && results[0].Imagen) {
        res.setHeader("Content-Type", "image/jpeg");
        res.send(results[0].Imagen);
      } else {
        res.redirect('/img/user.png'); // imagen por defecto
      }

    }
  );

});

router.get('/', (req, res) => {
  bd.query('SELECT * FROM Persona', (err, results) => {
    res.render('Personas', {
      Usuarios: results,
      msg: req.query.msg
    });
  });
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

    // 👇 redirige con mensaje
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
        console.log(err); // 👈 ESTO TE DIRÁ EL ERROR REAL
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