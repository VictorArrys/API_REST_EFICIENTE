const { UsuarioDAO } = require("./data/UsuarioDAO");

exports.AccesoSistema = class AccesoSistema {
  //funcionRespuesta lleva parametro error y resultado
  static iniciarSesion(usuario, password, funcionRespuesta) {
    UsuarioDAO.iniciarSesion(usuario, password, funcionRespuesta);
  }

  /*static restablecerContrase├▒a(correoElectronico, funcionRespuesta) {
        UsuarioDAO.restablecerContrase├▒a(correoElectronico, funcionRespuesta);
    }*/

  static habilitarPerfil(idUsuario, funcionRespuesta) {
    UsuarioDAO.habilitarPerfil(idUsuario, funcionRespuesta);
  }

  static deshabilitarPerfil(idUsuario, funcionRespuesta) {
    UsuarioDAO.deshabilitarPerfil(idUsuario, funcionRespuesta);
  }
};
