const { Router, query } = require('express');
const path = Router();
var mysqlConnection = require('../../utils/conexion');
const keys = require('../../settings/keys');
const jwt = require('jsonwebtoken');
const { send, status } = require('express/lib/response');
const req = require('express/lib/request');
const res = require('express/lib/response');
const pool = require('../../utils/conexion');
const mensajes = require('../../utils/mensajes');

function verifyToken(token){
    var statusCode = 0;
    try{
        const tokenData = jwt.verify(token, keys.key); 
        console.log(tokenData);
  
        if (tokenData["tipo"] == "Administrador" || tokenData["tipo"] == "Demandante") {
            statusCode = 200
            return statusCode
        }else{
            statusCode = 401
            return statusCode
          }
    
        } catch (error) { 
            statusCode = 401
            return statusCode
            
        }
}

function consoleError(error, ubicacion){
    console.log('--------------------------------------------------------------------------------------')
    console.log('Se ha presentado un problema en: ' + ubicacion)
    console.log('Error(es): ' + error.message)
    console.log('--------------------------------------------------------------------------------------')
}
 

function registrarUsuarioDemandante(datoDemandante, res, callback){
    var queryTwo = 'INSERT INTO perfil_usuario (nombre_usuario, estatus,  clave, correo_electronico, tipo_usuario) VALUES (?, ?, ?, ?, ? ) ;'

    var nombreU = datoDemandante['nombreUsuario']
    var estatus = datoDemandante['estatus']
    var clave = datoDemandante['clave']
    var correoElectronico = datoDemandante['correoElectronico']
    var tipo = 'Demandante'

    mysqlConnection.query(queryTwo, [nombreU, estatus, clave, correoElectronico, tipo], (error, registro) => {
        if (error){
            res.status(500)
            res.json(mensajes.errorInterno)
        }else if (registro.length == 0){
            res.status(404)
            res.json(mensajes.peticionNoEncontrada)
        }else{

            if (registro['affectedRows'] == 1){
                const registroUsuario = {}
                var id = registro.insertId

                registroUsuario['application/json'] = {
                    'clave': clave,
                    'correoElectronico': correoElectronico,
                    'estatus': estatus,
                    'idPerfilUsuario': id,
                    'nombreUsuario': nombreU
                };

                callback(registroUsuario)
            }else{
                res.status(500)
                res.json(mensajes.errorInterno)
            }

        }
    })
}

function actualizarUsuarioDemandante(registroDemandante,  res, callback){
    var queryTwo = 'UPDATE perfil_usuario SET nombre_usuario = ?, clave = ?, correo_electronico = ? WHERE id_perfil_usuario = ?;'
    
    var idUsuario = registroDemandante['idPerfilUsuario']
    var nombreU = registroDemandante['nombreUsuario']
    var clave = registroDemandante['clave']
    var correoElectronico = registroDemandante['correoElectronico']


    mysqlConnection.query(queryTwo, [nombreU, clave, correoElectronico, idUsuario] , (error, actualizacion) => {
        if (error){
            console.log(error)
            res.status(500)
            res.json(mensajes.errorInterno)
        }else if (actualizacion.length == 0){
            res.status(404)
            res.json(mensajes.peticionNoEncontrada)
        }else{

            if (actualizacion['affectedRows'] >= 1){
                const modificacionUsuario = {}
                var id = actualizacion.insertId

                modificacionUsuario['application/json'] = {
                    'clave': clave,
                    'correoElectronico': correoElectronico,
                    'idPerfilUsuario': idUsuario,
                    'nombreUsuario': nombreU
                }

                callback(modificacionUsuario['application/json'])
            }else{
                res.status(500)
                console.log('error actualizar despues de callback')
                res.json(mensajes.errorInterno)
            }
        }
    })
}

function  comprobarRegistro(nombreUsuario, correoElectronico, res, resultado){
    var queryOne = 'SELECT count(id_perfil_usuario) as Comprobacion FROM perfil_usuario WHERE nombre_usuario = ? OR  correo_electronico = ?';

    mysqlConnection.query(queryOne, [nombreUsuario, correoElectronico], (error, comprobacion) => {
        if(error){
            console.log('error funcion comprobacion')
            res.status(500)
            res.json(mensajes.errorInterno)
        }else{
            resultado(comprobacion[0]['Comprobacion'])
        }
    })
}

function  comprobarActualizacion(nombreUsuario, correoElectronico, res, resultado){
    var queryOne = 'SELECT count(id_perfil_usuario) as Comprobacion FROM perfil_usuario WHERE nombre_usuario = ? AND correo_electronico = ?';

    mysqlConnection.query(queryOne, [nombreUsuario, correoElectronico], (error, comprobacion) => {
        if(error){
            console.log('error funcion comprobacion')
            res.status(500)
            res.json(mensajes.errorInterno)
        }else{
            resultado(comprobacion[0]['Comprobacion'])
        }
    })
}

path.get('/v1/perfilDemandantes', (req, res) => {
    const token = req.headers['x-access-token'];
    var respuesta = verifyToken(token)

    try{
        if(respuesta == 200){
            var query = 'SELECT * FROM perfil_demandante;'
            pool = mysqlConnection

            pool.query(query, (error, resultadoDemandantes) => {
                if(error){
                    res.status(500)
                    res.json(mensajes.errorInterno)
                }else if (resultadoDemandantes.length == 0){
                    res.status(404)
                    res.json(mensajes.peticionNoEncontrada)
                }else{
                    var demandantes = resultadoDemandantes

                    res.status(200)
                    res.json(demandantes)
                }
            })
        }else if (respuesta == 401){
            res.status(respuesta)
            res.json(mensajes.tokenInvalido)
        }else{
            res.status(500)
            res.json(mensajes.errorInterno)
        }
    }catch (error){
        res.status(500)
        res.json(mensajes.errorInterno)
    }
});

path.get('/v1/perfilDemandantes/:idPerfilUsuarioDemandante', (req, res) => { 
    const token = req.headers['x-access-token'];
    var respuesta = verifyToken(token)
    const { idPerfilUsuarioDemandante } = req.params

    try {
        if (respuesta == 200){
            var query = 'SELECT * FROM perfil_demandante WHERE id_perfil_usuario_demandante = ?;'

            mysqlConnection.query(query, [idPerfilUsuarioDemandante], (error, resultadoDemandante) => {
                if (error){
                    console.log(error)
                    res.status(500)
                    res.json(mensajes.errorInterno)
                }else if (resultadoDemandante.length == 0){
                    res.status(404)
                    res.json(mensajes.peticionNoEncontrada)
                }else{
                    var getdemandante = resultadoDemandante[0]

                    const demandante = {}
                    demandante['application/json'] = {
                        'direccion': getdemandante['direccion'],
                        "fechaNacimiento": getdemandante['fecha_nacimiento'],
                        "nombre": getdemandante['nonbre'],
                        "telefono": getdemandante['telefono'],
                        "idperfilDemandante": getdemandante['id_perfil_demandante']
                    };

                    res.status(200)
                    res.json(demandante['application/json'])
                }
            })
        }else if (respuesta == 401){
            res.status(respuesta)
            res.json(mensajes.tokenInvalido)
        }else{
            res.status(500)
            res.json(mensajes.errorInterno)
        }
    } catch (error) {
        console.log(error)
        res.status(500)
        res.json(mensajes.errorInterno)
    }
});

path.post('/v1/perfilDemandantes', (req, res) => { // listo api
    var queryThree = 'INSERT INTO perfil_demandante (id_perfil_usuario_demandante, nonbre, fecha_nacimiento, telefono, direccion) VALUES ( ?, ?, ?, ?, ?);'
    const { clave, correoElectronico, direccion, estatus, fechaNacimiento, nombre, nombreUsuario, telefono  } = req.body

    try{
        comprobarRegistro(nombreUsuario, correoElectronico, res, function(resultado){
            if (resultado >= 1){
                res.status(422)
                res.json(mensajes.instruccionNoProcesada)
            }else{
                registrarUsuarioDemandante(req.body, res, function(registroUDemandante) {
                    if (res.error){
                        consoleError(error, 'Funcion: Registrar demandante. Paso: Error al registrar usuario')

                        res.status(500)
                        res.json(mensajes.errorInterno)
                    }else{
                        var idDeUsuario = 0
                        idDeUsuario = registroUDemandante['application/json']['idPerfilUsuario']
    
    
                        mysqlConnection.query(queryThree, [idDeUsuario, nombre, fechaNacimiento, telefono, direccion], (error, registro) => {
                            if (error){
                                consoleError(error, 'Funcion: Registrar Demandante. Paso: Error al registrar demandante')

                                res.status(500)
                                res.json(mensajes.errorInterno)
                            }else if (registro.length == 0){
                                res.status(404)
                                res.json(mensajes.peticionNoEncontrada)
                            }else{                          
                                if (registro['affectedRows'] == 1){
                                    
                                    var idDemandante = registro.insertId
                                    const demandante = {}
    
                                    demandante['application/json'] = {
                                        'idPerfilUsuario': registroUDemandante['application/json']['idPerfilUsuario'],
                                        'idPerfilDemandante': idDemandante
                                    };
    
                                    console.log(demandante)
    
                                    res.status(201)
                                    res.json(demandante['application/json'])
                                }
                            }
                        })
                    }
                })
            }
        })
    }catch (error){
        consoleError(error, 'Funcion: registrar demandante. Paso: Excepcion cachada')

        res.status(500)
        res.json(mensajes.errorInterno)
    }
});

path.put('/v1/perfilDemandantes/:idPerfilDemandante', (req, res) => {
    const token = req.headers['x-access-token'];
    var respuesta = verifyToken(token)
    const { idPerfilDemandante } = req.params
    const { clave, correoElectronico, direccion, estatus, fechaNacimiento, idPerfilUsuario, nombre, nombreUsuario, telefono } = req.body
    var queryThree = 'UPDATE perfil_demandante SET nonbre = ?, fecha_nacimiento = ?, telefono = ?, direccion = ? WHERE id_perfil_demandante = ? ;'
    try {
        if (respuesta == 200){
            comprobarActualizacion(nombreUsuario, correoElectronico, res, function(resultado) {
                if (resultado >= 1){
                    res.status(422)
                    res.json(mensajes.instruccionNoProcesada)
                }else{
                    actualizarUsuarioDemandante(req.body, res, function(actualizacionDemandante) {
                        if (res.error){
                            console.log('error funcion actualizar')
                            res.status(500)
                            res.json(mensajes.errorInterno)
                        }else{
                            console.log(actualizacionDemandante)
                            mysqlConnection.query(queryThree, [nombre, fechaNacimiento, telefono, direccion, idPerfilDemandante], (error, actualizacion) => {
                                if (error){
                                    console.log('error queryThree')
                                    res.status(500)
                                    res.json(mensajes.errorInterno)
                                }else if (actualizacion.length == 0){
                                    res.status(404)
                                    res.json(mensajes.peticionNoEncontrada)
                                }else{
                                    if (actualizacion['affectedRows'] == 1){          

                                        const modificacionDemandante = {}

                                        modificacionDemandante['application/json'] = {
                                            'clave': actualizacionDemandante['clave'],
                                            'correoElectronico': actualizacionDemandante['correoElectronico'],
                                            'direccion': direccion,
                                            'fechaNacimiento': fechaNacimiento,
                                            'idPerfilUsuario': actualizacionDemandante['idPerfilUsuario'], 
                                            'nombre': nombre,
                                            'nombreUsuario': actualizacionDemandante['nombreUsuario'],
                                            'telefono': telefono,
                                            'idPerfilAspirante': idPerfilDemandante
                                        }

                                        res.status(200)
                                        res.json(modificacionDemandante['application/json'])
                                    }
                                }
                            })
                        }
                    })
                }
            })
        }else if (respuesta == 401){
            res.status(respuesta)
            res.json(mensajes.tokenInvalido)
        }else{
            console.log('error if')
            res.status(500)
            res.json(mensajes.errorInterno)
        }
    } catch (error) {
        console.log('error catch')
        res.status(500)
        res.json(mensajes.errorInterno)
    }
})

module.exports = path;