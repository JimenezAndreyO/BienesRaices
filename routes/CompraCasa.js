const express = require('express');
const router = express.Router();
var bd = require('./bd');
require('dotenv').config();

const multer = require('multer');


const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get('/CargarCasas', function (req, res, next) {
  res.render('VentaDeCasas');
  console.log("Ingrese a cargar ventas de casas.");
});

router.get('/CargarBiblioteca', function (req, res) {

    const idPersona = req.session.IdPersona;

    if (!idPersona) {
        console.log("No hay sesión activa");
        return res.redirect("/Usuarios/InicioSesion");
    }

    bd.query("CALL MostrarCasasPorPersona(?)", [idPersona], (err, rows) => {

        if (err) {
            console.log(err);
            return res.status(500).send("Error en la BD");
        }

        let casas = rows && rows[0] ? rows[0] : [];

        // Convertir imágenes a base64
        casas = casas.map(casa => ({
            ...casa,
            ImagenBase64: casa.Imagen
                ? `data:image/jpeg;base64,${casa.Imagen.toString("base64")}`
                : null
        }));

        console.log("📦 Casas encontradas:", casas.length);

        res.render("Biblioteca", { casas });
    });

});


router.get('/MoficarCasa', function (req, res) {

    const idPersona = req.session.IdPersona;

    if (!idPersona) {
        console.log("No hay sesión activa");
        return res.redirect("/Usuarios/InicioSesion");
    }

    bd.query("CALL EditarEstadoCasa(?)", [idPersona], (err, rows) => {

      
    });

});


router.get('/EliminarCasa', function (req, res) {

    const idPersona = req.session.IdPersona;

    if (!idPersona) {
        console.log("No hay sesión activa");
        return res.redirect("/Usuarios/InicioSesion");
    }

    bd.query("CALL EliminarCasa(?)", [idPersona], (err, rows) => {

      
    });

});
router.post('/RegistroCasa', upload.any(), function (req, res) {

    if (!req.session.IdPersona) {
        return res.status(401).send("Debe iniciar sesión para registrar una casa.");
    }

    const idPersona = req.session.IdPersona;

    let casas = req.body.casas;
    const files = req.files;

    if (!casas) {
        return res.status(400).send("No se enviaron casas.");
    }

    // Convertir objeto a array
    casas = Object.keys(casas).map(k => casas[k]);

    // Asignar imágenes
    files.forEach(file => {
        const match = file.fieldname.match(/casas\[(\d+)\]\[Imagen\]/);
        if (match) {
            const index = parseInt(match[1]) - 1;
            if (casas[index]) {
                casas[index].Imagen = file.buffer;
            }
        }
    });

    let casasProcesadas = 0;

    casas.forEach((casa, index) => {

        if (!casa.Imagen) {
            return res.status(400).send(`Falta la imagen en la casa ${index + 1}`);
        }

        const sql = `CALL sp_InsertarCasaVenta(?, ?, ?, ?, ?, ?, ?)`;

        const parametros = [
            idPersona,
            casa.Imagen,
            casa.Direccion,
            casa.Pais,
            casa.Ciudad,
            casa.Descripcion,
            casa.Precio
        ];

        bd.query(sql, parametros, function (err) {

            if (err) {
                console.error("❌ Error al insertar casa:", err.sqlMessage || err);
                return res.status(500).send("Error insertando casa en la BD.");
            }

            casasProcesadas++;

            if (casasProcesadas === casas.length) {
                return res.redirect("/CompraCasa/CargarBiblioteca");

            }

        });

    });

});





module.exports = router;
