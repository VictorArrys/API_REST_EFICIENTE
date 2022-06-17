const { Router } = require('express');
const path = Router();
var mysqlConnection = require('../../utils/conexion');
const keys = require('../../settings/keys');
const jwt = require('jsonwebtoken');
const ruta = require('path');
const multer = require('multer');



//Respuestas
const mensajes = require('../../utils/mensajes');
const pool = require('../../utils/conexion');
const req = require('express/lib/request');
const res = require('express/lib/response');

function verifyToken(token){
    var statusCode = 0;
    try{
        const tokenData = jwt.verify(token, keys.key); 
  
        if (tokenData["tipo"] == "Empleador" || tokenData['tipo'] == 'Administrador' || tokenData['tipo'] == 'Aspirante' || tokenData['tipo'] == 'Demandante') {
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

const multerUpload = multer({storage:multer.memoryStorage(), limits:{fileSize:8*1024*1024*10}})

path.post('/v1/perfilAspirantes/:idPerfilAspirante/video', (req, res) => {
    var query = "UPDATE perfil_usuario SET video = ? WHERE id_perfil_usuario = ?;"
    const { idPerfilUsuario } = req.params

    mysqlConnection.query(query, [req.file.buffer, idPerfilUsuario], (error, resultadoVideo) => {
        if (error){
            res.status(500)
            res.json(mensajes.errorInterno)
        }else if(resultadoVideo.length == 0){
            //
        }else{
            res.status(200)
            res.json(mensajes.actualizacionExitosa)
        }
    })
});

function agregarOficiosAspirante(datoAspirante, callback){
    getOficios(datoAspirante['id_perfil_aspirante'], function(arregloOficios) {
        var nuevoAspirante = {
            'direccion': datoAspirante['direccion'],
            'fechaNacimiento': datoAspirante['fecha_nacimiento'],
            'idPerfilAspirante': datoAspirante['id_perfil_aspirante'],
            'nombre': datoAspirante['nombre'],
            'idPerfilusuario': datoAspirante['id_perfil_usuario_aspirante'],
            'oficios': arregloOficios,
            'telefono': datoAspirante['telefono']
        };
        
        callback(nuevoAspirante)
    })
}

function getOficios(id, callback){ 
    var query = 'SELECT * FROM categoria_aspirante where id_aspirante_ca = ?;'

    mysqlConnection.query(query, [id], (error, resultadoOficios) => {
        if (error){
            res.status(500)
            res.json(mensajes.errorInterno)
        }else{
            var arreglo = []
            for (var i = 0; i < resultadoOficios.length; i++){
                arreglo.push(i)
                arreglo[i] = {
                    'idAspirante': resultadoOficios[i]['id_aspirante_ca'],
                    'idCategoria': resultadoOficios[i]['id_categoria_ca'],
                    'experiencia': resultadoOficios[i]['experiencia']
                }
            }
            callback(arreglo)
        }
    })
}

function getAspirante(datoAspirante, callback){
    getOficios(datoAspirante, function(arregloOficios) {
        var registroAspirante = {
            'direccion': datoAspirante['direccion'],
            'fechaNacimiento': datoAspirante['fecha_nacimiento'],
            'idPerfilAspirante': datoAspirante['id_perfil_aspirante'],
            'nombre': datoAspirante['nombre'],
            'idPerfilusuario': datoAspirante['id_perfil_usuario_aspirante'],
            'oficios': arregloOficios,
            'telefono': datoAspirante['telefono']
        };
        
        callback(registroAspirante)
    })
}

/*path.get('/v1/perfilAspirantes/:idPerfilUsuarioAspirante/oficios', (req, res) => {
    const token = req.headers['x-access-token']
    var respuesta = verifyToken(token)
    var query = 'SELECT * FROM categoria_aspirante where id_aspirante_ca = ?;'
    const { idPerfilUsuarioAspirante } = req.params

    try{
        if (respuesta == 200){
            mysqlConnection.query(query, [idPerfilUsuarioAspirante], (error, resultadoOficios) => {
                if (error){
                    res.status(500)
                    res.json(mensajes.errorInterno)
                }else if (resultadoOficios.length == 0){
                    res.status(404)
                    res.json(mensajes.peticionIncorrecta)
                }else{
                    var oficios = []
                    console.log(resultadoOficios[0]['id_categoria_ca'])
                    for (var i = 0; i < resultadoOficios.length; i++){
                        oficios.push(i)
                        oficios[i] = {
                            'idAspirante': resultadoOficios[i]['id_aspirante_ca'],
                            'idCategoria': resultadoOficios[i]['id_categoria_ca'],
                            'experiencia': resultadoOficios[i]['experiencia']
                        }
                    }

                    res.status(200)
                    res.json(oficios)
                }
            })
        }else if (respuesta == 401){
            res.status(respuesta)
            res.json(mensajes.tokenInvalido)
        }else{

        }
    }catch (error){
        res.status(500)
        res.json(mensajes.errorInterno)
    }
})*/

path.get('/v1/perfilAspirantes', (req, res) => {
    const token = req.headers['x-access-token']
    var respuesta = verifyToken(token)
    var query = 'SELECT * FROM perfil_aspirante;'
    try {
        if (respuesta == 200){
            mysqlConnection.query(query, (error, resultadosAspirantes) => {
                if (error){
                    res.status(500)
                    res.json(mensajes.errorInterno)
                }else if(resultadosAspirantes.length == 0){
                    res.status(404)
                    res.json(mensajes.peticionIncorrecta)
                }else{
                    var cont = 0;
                    var listaAspirantes = []
                    if (resultadosAspirantes.length > 0){
                        resultadosAspirantes.forEach(aspirante => {
                            agregarOficiosAspirante(aspirante, function(resultado) {
                                
                                listaAspirantes.push(resultado)
                                if (listaAspirantes.length == resultadosAspirantes.length){
                                    res.status(200)
                                    res.json(listaAspirantes)
                                }
                            })
                        })
                    }else{
                        res.status(200)
                        res.json(listaAspirantes)
                    }
                    
                }
            })
        }else if(respuesta == 401){
            res.status(respuesta)
            res.json(mensajes.tokenInvalido)
        }else{
            res.status(500)
            res.json(mensajes.errorInterno) 
        }
    }catch (error) {
        res.status(500)
        res.json(mensajes.errorInterno)
    }
})



path.get('/v1/perfilAspirantes/:idPerfilUsuarioAspirante', (req, res) => {
    const token = req.headers['x-access-token']
    var respuesta = verifyToken(token)
    const { idPerfilUsuarioAspirante } = req.params

    try {
        if (respuesta == 200){
            var query = 'SELECT * FROM perfil_aspirante WHERE id_perfil_usuario_aspirante = ?;'

            mysqlConnection.query(query, [idPerfilUsuarioAspirante], (error, resultadoAspirante) => {
                if (error){
                    console.log(error)
                    res.status(500)
                    res.json(mensajes.errorInterno)
                }else if(resultadoAspirante.length == 0){
                    res.status(404)
                    res.json(mensajes.peticionIncorrecta)
                }else{
                    /*var idUsuarioAspirante = resultadoAspirante[0]['id_perfil_usuario_aspirante']
                    getAspirante(idUsuarioAspirante, function(getAspirante){
                        console.log(getAspirante)
                    })*/

                    var getAspirante = resultadoAspirante[0]
                    //var arrayVideo = []
                    /*if (getAspirante.video == null){
                        console.log('Fotografia vacia, se procede a poner null')
                    }else{
                        //arrayVideo = Uint8ClampedArray.from(Buffer.from(getAspirante.video.buffer, 'base64'))
                        getAspirante.video.forEach( b => arrayVideo.push(b) );
                    }*/
                    
                    const aspirante = {}

                    aspirante['application/json'] = {
                        'direccion': getAspirante['direccion'],
                        'fechaNacimiento': getAspirante['fecha_nacimiento'],
                        'idPerfilAspirante': getAspirante['id_perfil_aspirante'],
                        'nombre': getAspirante['nombre'],
                        'idPerfilUsuario': getAspirante['id_perfil_usuario_aspirante'],
                        'telefono': getAspirante['telefono'],
                        //'video': arrayVideo
                    }

                    res.status(200)
                    res.json(aspirante['application/json'])
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
        console.log("del catch")
        console.log(error)
        res.status(500)
        res.json(mensajes.errorInterno)
    }
});

path.post('/v1/perfilAspirantes', (req, res) => {
    var idDeUsuario = 0
    const {clave, correoElectronico, direccion, estatus, fechaNacimiento, nombre, nombreUsuario, oficios,
        telefono } = req.body
    try {
        var queryOne = 'INSERT INTO perfil_usuario (nombre_usuario, estatus, clave, correo_electronico, tipo_usuario) VALUES (?, ?, ?, ?, ?);'
        var queryTwo = 'INSERT INTO perfil_aspirante ( id_perfil_usuario_aspirante, nombre, direccion, fecha_nacimiento, telefono) VALUES (?, ?, ?, ?, ?); '
        var querythree = 'INSERT INTO categoria_aspirante (id_aspirante_ca, id_categoria_ca, experiencia) VALUES ? ;'
        const tipo = 'Aspirante'

        mysqlConnection.query(queryOne, [nombreUsuario, estatus, clave, correoElectronico, tipo], (error, registroUsuarioAspirante) => {
            if (error){
                console.log(error)
                res.status(500)
                res.json(mensajes.errorInterno)
            }else if(registroUsuarioAspirante.length == 0){
                res.status(404)
                res.json(mensajes.peticionNoEncontrada)
            }else{
                console.log('exito al registrar un aspirante')
                idDeUsuario = registroUsuarioAspirante.insertId
                    
                mysqlConnection.query(queryTwo, [idDeUsuario, nombre, direccion, fechaNacimiento, telefono], (error, registroPerfilAspirante) => {
                    if (error){
                        console.log(error)
                        res.status(500)
                        res.json(mensajes.errorInterno)
                    }else if(registroPerfilAspirante == 0){
                        res.status(403)
                        res.json(mensajes.prohibido)
                    }else{
                        var idUsuario = registroUsuarioAspirante.insertId

                        idAspirante = registroPerfilAspirante.insertId

                        var cont = 0

                        var valores = []

                        for(let i = 0; i < oficios.length; i++){
                            valores.push(i);
                        }

                        do{
                            valores[cont] = [idAspirante, oficios[cont].idCategoria, oficios[cont].experiencia]
                            cont = cont + 1
                        }while(cont != oficios.length)

                        mysqlConnection.query(querythree, [valores], (error, registroOficios) => {
                            if (error){
                                console.log(error)
                                res.status(500)
                                res.json(mensajes.errorInterno)
                            }else if(registroOficios.length == 0){
                                res.status(403)
                                res.json(mensajes.prohibido)
                            }else{
                                console.log("exito, oficios insertados: " + registroOficios.affectedRows);

                                const PerfilAspirante = {}
                                PerfilAspirante['application/json'] = {
                                    'clave': clave,
                                    'correoElectronico': correoElectronico,
                                    'direccion': direccion,
                                    'estatus': estatus,
                                    'fechaNacimiento': fechaNacimiento,
                                    'idPerfilUsuario': idUsuario,
                                    'nombre': nombre,
                                    'nombreUsuario': nombreUsuario,
                                    'oficios': valores,
                                    'telefono': telefono,
                                    'idPerfilAspirante': idAspirante,
                                    }

                                    console.log(PerfilAspirante)
                                    res.status(201)
                                    res.json(PerfilAspirante['application/json'])

                                }
                             })


                        }
                    })
                }
            })
    } catch (error) {
        res.status(500)
        res.json(mensajes.errorInterno)
    }


});

/*path.get('/v1', (req, res) => {
    console.log('jala')
    var arraycategorias = []
    arraycategorias.push(13)
    arraycategorias.push(13)
    arraycategorias.push(13)

    
    var arrayOficios = []

    arrayOficios.push(1)
    arrayOficios.push(10)
    arrayOficios.push(13)

    /*arrayOficios.push('fontaneria')
    arrayOficios.push('albañileria')
    arrayOficios.push('plomeria')
    arrayOficios.push('kotlin')

    for (var i = 0; i < 3; i++){
        console.log(arraycategorias[i])
        console.log(arrayOficios[i])
        var query1 = 'UPDATE categoria_aspirante SET id_categoria_ca = ?, experiencia = ?  WHERE id_aspirante_ca = ? AND id_categoria_ca = ? ;'
        mysqlConnection.query(query1, [arrayOficios[i], "1 a 6 meses", 60, arraycategorias[i]], (err, rows) => {
            if (err){
                console.log(err)
            }else if (rows.length == 0){
                
            }else{
                console.log(rows)
            }
        })

    }

});*/

path.put('/v1/perfilAspirantes/:idPerfilAspirante', (req, res) => {
    const token = req.headers['x-access-token']
    var respuesta = verifyToken(token)
    const { idPerfilAspirante } = req.params
    const {clave, correoElectronico, direccion, estatus, fechaNacimiento, nombre, nombreUsuario, oficios,
        telefono } = req.body
    
    try {
        if (respuesta == 200){
            var queryOne = 'UPDATE perfil_usuario SET nombre_usuario = ?, estatus = ?, clave = ?, correo_electronico = ? WHERE id_perfil_usuario = ?;' 
            var queryTwo = 'UPDATE perfil_aspirante SET nombre = ?, direccion = ?, fecha_nacimiento = ?, telefono = ? WHERE id_perfil_aspirante = ?;'
            var querythree = 'aqui podriamos borrar la tabla y volverla a insertar'

            mysqlConnection.query(queryOne, [], (error, actualizarUsuarioAspirante) => {
                if (error){
                    res.status(500)
                    res.json(mensajes.errorInterno)
                }else if (actualizarUsuarioAspirante.length == 0){
                    //
                }else{
                    mysqlConnection.query(queryTwo, [], (error, actualizarPerfilAspirante) => {
                        if (error){
                            res.status(500)
                            res.json(mensajes.errorInterno)
                        }else if (actualizarPerfilAspirante.length == 0){
                            //
                        }else{
                            mysqlConnection.query(querythree, [], (error, actualizaroficios) => {
                                if (error){
                                    res.status(500)
                                    res.json(mensajes.errorInterno)
                                }else if(actualizaroficios.length == 0){
                                    //
                                }else{
                                    var modificarUsuarioAspirante = actualizarUsuarioAspirante
                                    var modificarPerfilAspirante = actualizarPerfilAspirante
                                    var arrayFotografia = Uint8ClampedArray.from(Buffer.from(modificarUsuarioAspirante.fotografia, 'base64'))

                                    const actualizarPerfilAspirante = {}
                                    actualizarPerfilAspirante['application/json'] = {
                                        'clave': modificarUsuarioAspirante['clave'],
                                        'correoElectronico': modificarUsuarioAspirante['correo_electronico'],
                                        'direccion': modificarPerfilAspirante['direccion'],
                                        'estatus': modificarUsuarioAspirante['estatus'],
                                        'fechaNacimiento': modificarPerfilAspirante['fecha_nacimiento'],
                                        'idPerfilUsuario': modificarUsuarioAspirante['id_perfil_usuario'],
                                        'nombre': modificarPerfilAspirante['nombre'],
                                        'nombreUsuario': modificarUsuarioAspirante['nombre_usuario'],
                                        //'oficios': ,
                                        'telefono': modificarPerfilAspirante['telefono'],
                                        //'video': perfilAspirante['video'],
                                        'idPerfilAspirante': modificarPerfilAspirante['id_perfil_aspirante'],
                                        'fotografia': arrayFotografia
                                        //'curriculum': perfilAspirante['curriculum']
                                    }

                                    res.status(200)
                                    res.json(actualizarPerfilAspirante['application/json'])
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
            console.log(respuesta)
            res.status(500)
            res.json(mensajes.errorInterno)
        }
    } catch (error) {
        res.status(500)
        res.json(mensajes.errorInterno)
    }
})

module.exports = path;