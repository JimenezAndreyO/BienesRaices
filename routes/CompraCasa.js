const express = require('express');
const router = express.Router();
var bd = require('./bd');
require('dotenv').config();

const multer = require('multer');

// ⭐ USAR STORAGE EN MEMORIA PARA GUARDAR LA IMAGEN EN MYSQL ⭐
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

router.post('/RegistroCasa', upload.any(), async function (req, res, next) {
    if (!req.session.IdPersona) {
        return res.status(401).send("Debe iniciar sesión para registrar una casa.");
    }

    const idPersona = req.session.IdPersona;
    let casas = req.body.casas;
    const files = req.files;

    if (!casas || Object.keys(casas).length === 0) {
        return res.status(400).send("No se enviaron casas.");
    }

    // Convertir el objeto casas {0: {...}, 1: {...}} → array
    casas = Object.values(casas);

    // Asignar imágenes a cada casa
    files.forEach(file => {
        const match = file.fieldname.match(/casas\[(\d+)\]\[Imagen\]/);
        if (match) {
            const index = parseInt(match[1]);
            if (casas[index]) {
                casas[index].Imagen = file.buffer; // Buffer de la imagen
            }
        }
    });

    try {
        // Aquí convertimos cada query en una Promise
        const promesas = casas.map((casa, index) => {
            return new Promise((resolve, reject) => {
                if (!casa.Imagen) {
                    return reject(`Falta la imagen en la casa ${index + 1}`);
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

                bd.query(sql, parametros, (err, result) => {
                    if (err) {
                        console.error("Error casa", index, err);
                        reject(`Error al insertar la casa ${index + 1}: ${err.sqlMessage || err.message}`);
                    } else {
                        console.log(`Casa ${index + 1} insertada correctamente`);
                        resolve(result);
                    }
                });
            });
        });

        // Esperamos a que TODAS terminen (o falle alguna)
        await Promise.all(promesas);

        console.log("TODAS las casas insertadas con éxito");
        return res.redirect("/CargarBiblioteca");

    } catch (error) {
        console.error("Error en el registro de casas:", error);
        return res.status(400).send(error); // o 500 si prefieres
    }
});



module.exports = router;
