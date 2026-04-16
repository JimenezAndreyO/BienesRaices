const express = require('express');
const router = express.Router();
var bd = require('./bd');
require('dotenv').config();
const multer = require('multer');

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    files: 20
  }
});


module.exports = router;


router.get('/CargarCasas', function (req, res, next) {
  res.render('VentaDeCasas');
  console.log("Ingrese a cargar ventas de casas.");
});

router.get('/CargarBiblioteca', function (req, res) {

    const idPersona = req.session.IdPersona;

    if (!idPersona) {
        return res.redirect("/Usuarios/InicioSesion");
    }

    // 1️⃣ Traer casas
    bd.query(
      "SELECT * FROM CasasVentas WHERE idPersona = ?",
      [idPersona],
      function (err, casas) {

        if (err) {
            console.error(err);
            return res.status(500).send("Error cargando casas.");
        }

        if (casas.length === 0) {
            return res.render("Biblioteca", { casas: [] });
        }

        // 2️⃣ Traer imágenes por casa
        const ids = casas.map(c => c.idCasaVenta);

        bd.query(
          `SELECT idCasaVenta, Imagen FROM CasaImagenes
           WHERE idCasaVenta IN (?)`,
          [ids],
          function (err, imagenes) {

            if (err) {
                console.error(err);
                return res.status(500).send("Error cargando imágenes.");
            }

            // 3️⃣ Agrupar imágenes por casa
            const map = {};
            imagenes.forEach(img => {
                if (!map[img.idCasaVenta]) {
                    map[img.idCasaVenta] = [];
                }
                map[img.idCasaVenta].push(
                    `data:image/jpeg;base64,${img.Imagen.toString('base64')}`
                );
            });

            // 4️⃣ Asignar imágenes a cada casa
            casas = casas.map(casa => ({
                ...casa,
                Imagenes: map[casa.idCasaVenta] || []
            }));

            console.log("🧪 DEBUG IMAGENES:");
            casas.forEach(c => {
              console.log(
                "Casa:", c.idCasaVenta,
                "imagenes:", c.Imagenes?.length,
                c.Imagenes?.[0]?.substring(0, 30)
              );
            });


            res.render("Biblioteca", { casas });
        });
    });
});



// MODIFICAR
router.put('/ModificarCasa/:id', function (req, res) {

    const idPersona = req.session.IdPersona;
    const idCasa = req.params.id;
    const nuevoEstado = "Vendida"

    if (!idPersona) {
        return res.status(401).json({ mensaje: "No hay sesión activa" });
    }

   bd.query(
        "CALL EditarEstadoCasa(?, ?, ?)",
        [idCasa, idPersona, nuevoEstado],
        (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ mensaje: "Error al modificar el estado" });
            }

            res.json({ mensaje: "Estado actualizado correctamente" });
    });
});

// ELIMINAR
router.delete('/EliminarCasa/:id', function (req, res) {

    const idPersona = req.session.IdPersona;
    const idCasaVenta = req.params.id;

    console.log("Ingresamos en el delete", idCasaVenta, idPersona);

    if (!idPersona) {
        return res.status(401).json({ mensaje: "No hay sesión activa" });
    }

    bd.query(
        "CALL EliminarCasa(?, ?)",
        [idCasaVenta, idPersona],
        (err) => {
            if (err) {
                console.error("Error SP EliminarCasa:", err);
                return res.status(500).json({ mensaje: "Error al eliminar la casa" });
            }

            res.json({ mensaje: "Casa eliminada correctamente" });
        }
    );
});
router.get('/Detalle/:idCasaVenta', function (req, res) {

  const idCasaVenta = req.params.idCasaVenta;

  console.log("Ingrese a Detalle:", idCasaVenta);

  // 1️⃣ Obtener la casa
  bd.query(
    'SELECT * FROM CasasVentas WHERE idCasaVenta = ?',
    [idCasaVenta],
    function (err, casas) {

      if (err) {
        console.error(err);
        return res.status(500).send("Error al cargar la casa");
      }

      if (!casas || casas.length === 0) {
        return res.status(404).send("Casa no encontrada");
      }

      const casa = casas[0];

      // 2️⃣ Obtener TODAS las imágenes
      bd.query(
        'SELECT Imagen FROM CasaImagenes WHERE idCasaVenta = ?',
        [idCasaVenta],
        function (err, imagenes) {

          if (err) {
            console.error(err);
            return res.status(500).send("Error al cargar imágenes");
          }

          console.log("Cantidad imágenes:", imagenes.length);

          // 3️⃣ Convertir imágenes a Base64 de forma segura
          casa.Imagenes = [];

          if (imagenes && imagenes.length > 0) {
            casa.Imagenes = imagenes
              .filter(img => img.Imagen && Buffer.isBuffer(img.Imagen))
              .map(img =>
                `data:image/jpeg;base64,${img.Imagen.toString('base64')}`
              );
          }

          console.log("Imágenes convertidas:", casa.Imagenes.length);

          // 4️⃣ Render
          res.render('MuestraDeCasaIndividual', { casa });
        }
      );
    }
  );
});


router.post(
  '/RegistroCasa',
  upload.array('imagenes', 20),
  async function (req, res) {

    if (!req.session.IdPersona) {
        return res.status(401).send("Debe iniciar sesión.");
    }

    const idPersona = req.session.IdPersona;
    const files = req.files;

    console.log("🧪 req.files:", files);
    console.log("🧪 cantidad:", files?.length);


    const { Direccion, Pais, Ciudad, Descripcion, Precio } = req.body;

    if (!files || files.length === 0) {
        return res.status(400).send("Debe subir al menos una imagen.");
    }

    if (!Direccion || !Pais || !Ciudad || !Precio) {
        return res.status(400).send("Faltan datos obligatorios.");
    }

    try {
        // 1️⃣ Obtener correo
        const [persona] = await bd.promise().query(
            'SELECT Correo FROM Persona WHERE idPersona = ?',
            [idPersona]
        );

        if (persona.length === 0) {
            return res.status(500).send("Usuario no encontrado.");
        }

        const correo = persona[0].Correo;

        // 2️⃣ Insertar casa
        const [result] = await bd.promise().query(
          `INSERT INTO CasasVentas
           (idPersona, CorreoElectronico, Direccion, Pais, Ciudad, Descripcion, Precio, Estado)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'venta')`,
          [idPersona, correo, Direccion, Pais, Ciudad, Descripcion || '', Precio]
        );

        const idCasaVenta = result.insertId;

        // 3️⃣ Insertar imágenes (todas)
        const sqlImagen = `
          INSERT INTO CasaImagenes (idCasaVenta, Imagen)
          VALUES (?, ?)
        `;

        const inserts = files.map(file =>
          bd.promise().query(sqlImagen, [idCasaVenta, file.buffer])
        );

        await Promise.all(inserts);

        res.redirect("/CompraCasa/CargarBiblioteca");

    } catch (err) {
        console.error("❌ Error registro casa:", err);
        res.status(500).send("Error registrando casa.");
    }
});


router.get('/Contactar/:id', function(req, res){

  const id = req.params.id;

  bd.query(`
    SELECT Nombre, Apellido1, Correo, Telefono, idPersona
    FROM Persona
    WHERE idPersona = ?
  `, [id], function(err, results){

    if (err) {
      console.log(err);
      return res.send("Error");
    }

    const vendedor = results[0];

    res.render('ComprarCasa', { vendedor });

  });

});
module.exports = router;
