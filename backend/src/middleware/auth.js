const { unauthorized, forbidden } = require('../utils/errors');

/**
 * RF-15 y RNF Seguridad.
 * Verifica el ID token de Firebase Auth (JWT firmado por Google) que envía el
 * cliente en "Authorization: Bearer <token>". La contraseña nunca pasa por el backend:
 * el inicio de sesión lo hace Firebase Auth en la webapp y en la app Android.
 *
 * @param {{verifyIdToken: (t: string) => Promise<object>, userService: import('../services/UserService')}} deps
 */
function authenticate({ verifyIdToken, userService }) {
  return async (req, res, next) => {
    try {
      const header = req.headers.authorization || '';
      const [scheme, token] = header.split(' ');
      if (scheme !== 'Bearer' || !token) throw unauthorized('Falta el token de autenticación');

      let decoded;
      try {
        decoded = await verifyIdToken(token);
      } catch {
        throw unauthorized('Token inválido o expirado');
      }

      const perfil = await userService.obtenerOCrearPerfil(decoded);
      if (perfil.activo === false) throw forbidden('Su cuenta está desactivada');

      req.user = { ...perfil, id: decoded.uid };
      next();
    } catch (err) {
      next(err);
    }
  };
}

/** RNF Seguridad: control de acceso basado en roles. */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.rol)) {
      return next(forbidden(`Acción permitida solo para: ${roles.join(', ')}`));
    }
    next();
  };
}

module.exports = { authenticate, requireRole };
