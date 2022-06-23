const { Router } = require('express');
const path = Router();
var mysqlConnection = require('../../utils/conexion');
const keys = require('../../settings/keys');
const jwt = require('jsonwebtoken');

const { GestionSolicitudesEmpleo } = require('../componentes/GestionSolcitudesEmpleo/GestionSolicitudesEmpleo');
const GestionToken = require('../utils/GestionToken');

//Respuestas
const mensajes = require('../../utils/mensajes')

//Función para verificar el token
function verifyToken(token){
    var statusCode = 0;
    try{
        const tokenData = jwt.verify(token, keys.key); 
        console.log(tokenData);
  
        if (tokenData["tipo"] == 'Empleador') {
            statusCode = 200
            return statusCode
        }else{
            //Caso que un token exista pero no contenga los permisos para la petición
            statusCode = 401
            return statusCode
          }
    
        } catch (error) { //Caso ..de un token invalido, es decir que no exista
            statusCode = 401
            return statusCode
            
        }
}

function obtenerFechaActual(){
    let fechaActual = new Date()
    let meses = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
    //Estructurar la fecha

    let month = fechaActual.getMonth()
    let day = fechaActual.getDate()
    let year = fechaActual.getFullYear()

    let fechaEstructurada = year + '-'  + meses[month] + '-' + day

    console.log(fechaEstructurada)
    return fechaEstructurada
}

function existeSolicitud(idSolicitudEmpleo, res, callback){
    var pool = mysqlConnection

    pool.query('SELECT * FROM solicitud_aspirante WHERE id_solicitud_aspirante = ?;',[idSolicitudEmpleo] , (error, resultadoSolicitudEmpleo)=>{
        if(error){ 
            console.log('Error: ')
            res.status(500)
            console.log(error)
            res.json(mensajes.errorInterno);
            
        }else if(resultadoSolicitudEmpleo.length == 0){
            console.log('No se encontro la solicitud')
            res.status(404)
            res.json(mensajes.peticionNoEncontrada);
 
        }else{
            
            const solicitudEmpleo = resultadoSolicitudEmpleo[0];

            //Caso que la solicitud ya fue aceptada
            if(solicitudEmpleo['estatus'] == 0){
                console.log('No se puede aprobar una solicitud que ya cuenta con el estado de aporbada')
                res.status(403)
                res.json(mensajes.prohibido);
            //Caso que la solicitud fue rechazada
            }else if(solicitudEmpleo['estatus'] == -1){
                
                console.log('No se puede aprobar una solicitud que ya cuenta con el estado de rechazada')
                res.status(403)
                res.json(mensajes.prohibido);
            //El reporte esta pendiente
            }else if(solicitudEmpleo['estatus'] == 1){
                console.log(solicitudEmpleo)
                callback(solicitudEmpleo)

            }else{  
                console.log('No se pudo comprender la solicitud')
                res.status(400)
                res.json(mensajes.peticionIncorrecta);
            }   


        }
    });

}

function aceptarSolicitud(idSolicitudEmpleo, res, callback){
    var pool = mysqlConnection

    pool.query('UPDATE solicitud_aspirante SET estatus = 0 WHERE id_solicitud_aspirante = ?;',[idSolicitudEmpleo] , (error, resultadoSolicitudEmpleo)=>{
        if(error){ 
            callback(0)

            console.log('Error: ')
            res.status(500)
            console.log(error)
            res.json(mensajes.errorInterno);
        }else if(resultadoSolicitudEmpleo.length == 0){
            callback(0)
            console.log('No se acepto la solicitud')
            res.status(404)
            res.json(mensajes.peticionNoEncontrada);

        }else{
            console.log(resultadoSolicitudEmpleo['changedRows'])
            callback(resultadoSolicitudEmpleo['changedRows'])

        }
    });

}

function existeContratacion(solicitudEmpleo, res, callback){
    var pool = mysqlConnection

    pool.query('SELECT * FROM contratacion_empleo WHERE id_oferta_empleo_coe = ?;',[solicitudEmpleo['id_oferta_empleo_sa']] , (error, existeContratacion)=>{
        if(error){
            console.log('Error en existe contratacion')
            console.log(error)
            res.status(500) 
            res.json(mensajes.errorInterno);

        }else if(existeContratacion.length == 0){
            callback(0)
            console.log('No existe la contratación')
            res.status(404)
            res.json(mensajes.peticionNoEncontrada);

        }else{ //En caso de existir la contratación solo agregamos el aspirante a ella
            callback(existeContratacion[0]['id_contratacion_empleo'])
            
        }

    });  

}

function crearConversacion(solicitudEmpleo, res, callback){
    var pool = mysqlConnection
    // Si aun no existe obtenemos los datos de la oferta para luego crear la contratacion_empleo

    pool.query('SELECT * FROM oferta_empleo WHERE id_oferta_empleo= ?;',[solicitudEmpleo['id_oferta_empleo_sa']] , (error, resultadoOfertaEmpleo)=>{
        if(error){ 
            console.log('Error: ')
            res.status(500)
            console.log(error)
            res.json(mensajes.errorInterno);
            
        }else if(resultadoOfertaEmpleo.length == 0){
            
            console.log('No se encontro la oferta de empleo')
            res.status(404)
            res.json(mensajes.peticionNoEncontrada);

        }else{
            const ofertaEmpleo = resultadoOfertaEmpleo[0]
            
            const fechaContratacion = obtenerFechaActual()
            const nombreEmpleo = ofertaEmpleo['nombre']
            
            //Creamos la conversacion
            mysqlConnection.query('INSERT INTO conversacion(nombre_empleo, nombre, fecha_contratacion) VALUES(? ,? ,?);',[nombreEmpleo, 'oferta_empleo', fechaContratacion] , (error, resultadoConversacion)=>{
                if(error){ 
                    console.log('Error: ')
                    res.status(500)
                    console.log(error)
                    res.json(mensajes.errorInterno);
                }else if(resultadoConversacion.length == 0){  
                    console.log('No se creo la conversación')
                    res.status(404)
                    res.json(mensajes.peticionNoEncontrada);  
        
                }else{
                    const conversacionCreada = resultadoConversacion
                    callback(conversacionCreada['insertId'])

                }

            });    
        }

    });     

}

function crearContratacion(solicitudEmpleo, idConversacion, res, callback){
    var pool = mysqlConnection
    // Si aun no existe obtenemos los datos de la oferta para luego crear la contratacion_empleo

    pool.query('SELECT * FROM oferta_empleo WHERE id_oferta_empleo= ?;',[solicitudEmpleo['id_oferta_empleo_sa']] , (error, resultadoOfertaEmpleo)=>{
        if(error){ 
            console.log('Error: ')
            res.status(500)
            console.log(error)
            res.json(mensajes.errorInterno);
        }else if(resultadoOfertaEmpleo.length == 0){
            
            console.log('No se encontro la oferta de empleo')
            res.status(404)
            res.json(mensajes.peticionNoEncontrada);

        }else{
            const ofertaEmpleo = resultadoOfertaEmpleo[0]
            const fechaContratacion = obtenerFechaActual()
            const fechaFinalizacion = ofertaEmpleo['fecha_finalizacion']
            
            //Creamos la contratacion
            //Estatus de la contratación {1: En curso, 0: Terminada}
            mysqlConnection.query('INSERT INTO contratacion_empleo(id_oferta_empleo_coe, fecha_contratacion, fecha_finalizacion, estatus, id_conversacion_coe) VALUES(?, ? ,? , ?, ?);',[solicitudEmpleo['id_oferta_empleo_sa'], fechaContratacion, fechaFinalizacion, 1, idConversacion] , (error, resultadoContratacion)=>{
                if(error){ 
                    console.log('Error: ')
                    res.status(500)
                    console.log(error)
                    res.json(mensajes.errorInterno);
                }else if(resultadoContratacion.length == 0){  
                    console.log('No se creo la contratación')
                    res.status(404)
                    res.json(mensajes.peticionNoEncontrada);                                              
        
                }else{
                    
                    const contratacionNueva = resultadoContratacion
                    console.log(contratacionNueva)
                    callback(contratacionNueva['insertId'])
                
                }

            });    
        }

});     

}

function crearContratacionAspirante(contratacion ,idAspirante, idEmpleador, res, callback){

    mysqlConnection.query('INSERT INTO contratacion_empleo_aspirante(id_contratacion_empleo_cea, id_perfil_aspirante_cea, id_perfil_empleador_cea, valoracion_aspirante, valoracion_empleador) VALUES(?, ?, ?, ?, ?)',[contratacion ,idAspirante, idEmpleador, 0, 0] , (error, resultadoContratacionAspirante)=>{
        if(error){ 
            console.log('Error: ')
            res.status(500)
            console.log(error)
            res.json(mensajes.errorInterno);
        }else if(resultadoContratacionAspirante.length == 0){

            console.log('No se creo la contratación aspirante')
            res.status(404)
            res.json(mensajes.peticionNoEncontrada);     
        }else{
            const contratacionEmpleoAspirante = resultadoContratacionAspirante
            console.log(contratacionEmpleoAspirante['affectedRows'])
            callback(contratacionEmpleoAspirante['affectedRows'])
            
        }

    });
}

function obtenerIdEmpleador(solicitudEmpleo, res, callback){
    var pool = mysqlConnection
    pool.query('SELECT id_perfil_oe_empleador FROM oferta_empleo WHERE id_oferta_empleo= ?;',[solicitudEmpleo['id_oferta_empleo_sa']] , (error, resultadoOfertaEmpleo)=>{
        if(error){ 
            console.log('Error: ')
            res.status(500)
            console.log(error)
            res.status(500)
            res.json(mensajes.errorInterno);
            
        }else if(resultadoOfertaEmpleo.length == 0){
            
            console.log('No se encontro la oferta de empleo')
            res.status(404)
            res.json(mensajes.peticionNoEncontrada);

        }else{

            console.log(resultadoOfertaEmpleo[0]['id_perfil_oe_empleador'])

            callback(resultadoOfertaEmpleo[0]['id_perfil_oe_empleador'])
            
        }

    });   
}

path.get('/v1/solicitudesEmpleo', (req, res) => {
    //Creamos la constante del token que recibimos
    const token = req.headers['x-access-token'];
    var respuesta = verifyToken(token)

    if(respuesta == 200){
        var pool = mysqlConnection
        // estatus de la solicitud de empleo {1: pendiente, 0: aprobada, -1: rechazada }
        pool.query('SELECT solicitud_aspirante.*, perfil_aspirante.nombre, perfil_aspirante.id_perfil_usuario_aspirante FROM solicitud_aspirante INNER JOIN perfil_aspirante ON perfil_aspirante.id_perfil_aspirante = solicitud_aspirante.id_perfil_aspirante_sa WHERE id_oferta_empleo_sa = ?;', [req.query.idOfertaEmpleo], (error, resultadoSolicitudesEmpleo)=>{
            if(error){ 
                res.json(mensajes.errorInterno);
                res.status(500)
            }else if(resultadoSolicitudesEmpleo.length == 0){

                console.log('No se encontro solicitudes de empleo de esta oferta de empleo')
                res.status(404)
                res.json(mensajes.peticionNoEncontrada);
     
            }else{
                
                var solcitudesEmpleo = resultadoSolicitudesEmpleo;
                res.status(200);                  
                res.json(solcitudesEmpleo);            
    
            }
        });
    }else if(respuesta == 401){
        res.status(respuesta)
        res.json(mensajes.tokenInvalido);

    }else{
        res.status(500)
        res.json(mensajes.errorInterno);
        
    }

});

path.get('/v1/solicitudesEmpleo/:idSolicitudEmpleo', (req, res) => {
    //Creamos la constante del token que recibimos
    const token = req.headers['x-access-token'];
    var respuesta = verifyToken(token)

    if(respuesta == 200){
        var pool = mysqlConnection
        pool.query('SELECT * FROM solicitud_aspirante WHERE id_solicitud_aspirante = ?;',[req.params.idSolicitudEmpleo] , (error, resultadoSolicitudEmpleo)=>{
            if(error){ 
                res.json(mensajes.errorInterno);
                res.status(500)
            }else if(resultadoSolicitudEmpleo[0].length == 0){
    
                res.status(404)
                res.json(mensajes.peticionNoEncontrada);
     
            }else{
                
                var solicitudEmpleo = resultadoSolicitudEmpleo[0];
                
                //Caso que el reporte ya fue atendido
                if(solicitudEmpleo['estatus'] == 0){
                    res.status(400)
                    res.json(mensajes.peticionIncorrecta);
                //Caso que el reporte fue rechazado
                }else if(solicitudEmpleo['estatus'] == -1){
                    res.status(400)
                    res.json(mensajes.peticionIncorrecta);
                //El reporte esta pendiente
                }else if(solicitudEmpleo['estatus'] == 1){

                    res.status(200);                  
                    res.json(solicitudEmpleo);  

                }else{
                    res.status(400)
                    res.json(mensajes.peticionIncorrecta);
                }          
    
            }
        });
    }else if(respuesta == 401){
        res.status(respuesta)
        res.json(mensajes.tokenInvalido);

    }else{
        res.status(500)
        res.json(mensajes.errorInterno);
        
    }

});

function reducirVacante(idOfertaEmpleo,res, callback){

   var updateQuery = 'UPDATE oferta_empleo SET vacantes = vacantes - 1 WHERE id_oferta_empleo = ?;' 
   mysqlConnection.query(updateQuery,[idOfertaEmpleo], (err, rows, fields) => {
    if (!err) {
        console.log(rows['changedRows'])
        callback(rows['changedRows'])
    } else {
        consoleError(err, 'Reducir vacantes')
        res.status(500)
        res.json(mensajes.errorInterno)
    
    }
}); 

}

path.patch('/v1/solicitudesEmpleo/:idSolicitudEmpleo/aceptada', (req, res) => {

    //Creamos la constante del token que recibimos
    const token = req.headers['x-access-token'];
    
    var respuesta = GestionToken.ValidarTokenTipoUsuario(token, "Empleador")
    
    if(respuesta['statusCode'] == 200){
        var idSolicitudEmpleo = req.params.idSolicitudEmpleo

        GestionSolicitudesEmpleo.patchAceptarSolicitud(idSolicitudEmpleo, (codigoRespuesta, cuerpoRespuestaSolicitud)=>{
            
            res.status(codigoRespuesta)
            res.json(cuerpoRespuestaSolicitud)

        })
    }else if(resprespuesta['statusCode'] == 401){
        res.status(respuesta['statusCode'])
        res.json(mensajes.tokenInvalido);

    }else{
        res.status(500)
        res.json(mensajes.errorInterno);
        
    }

});


path.patch('/v1/solicitudesEmpleo/:idSolicitudEmpleo/rechazada', (req, res) => {
    //Creamos la constante del token que recibimos
    const token = req.headers['x-access-token'];
    var respuesta = verifyToken(token)

    if(respuesta == 200){
        var pool = mysqlConnection
        pool.query('SELECT * FROM solicitud_aspirante WHERE id_solicitud_aspirante = ?;',[req.params.idSolicitudEmpleo] , (error, resultadoSolicitudEmpleo)=>{
            if(error){ 
                res.status(500)
                res.json(mensajes.errorInterno);
                
            }else if(resultadoSolicitudEmpleo[0].length == 0){
    
                res.status(404)
                res.json(mensajes.peticionNoEncontrada);
     
            }else{
                
                var solicitudEmpleo = resultadoSolicitudEmpleo[0];
                
                //Caso que el reporte ya fue atendido
                if(solicitudEmpleo['estatus'] == 0){
                    res.status(400)
                    res.json(mensajes.peticionIncorrecta);
                //Caso que el reporte fue rechazado
                }else if(solicitudEmpleo['estatus'] == -1){
                    res.status(400)
                    res.json(mensajes.peticionIncorrecta);
                //El reporte esta pendiente
                }else if(solicitudEmpleo['estatus'] == 1){
                    
                    pool.query('UPDATE solicitud_aspirante SET estatus = ? WHERE id_solicitud_aspirante = ?;',[-1, req.params.idSolicitudEmpleo] , (error, resultadoSolicitudEmpleo)=>{
                        if(error){ 
                            res.status(500)
                            res.json(mensajes.errorInterno);
                            
                        }else if(resultadoSolicitudEmpleo.length == 0){
                            res.status(404)
                            res.json(mensajes.peticionNoEncontrada);
                
                        }else{
                            res.sendStatus(204);                     
                
                        }
                    });

                }else{
                    res.status(400)
                    res.json(mensajes.peticionIncorrecta);
                }          
    
            }
        });

        
    }else if(respuesta == 401){
        res.status(respuesta)
        res.json(mensajes.tokenInvalido);

    }else{
        res.status(500)
        res.json(mensajes.errorInterno);
        
    }

});

module.exports = path;