const { Rol } = require('../models/enums');
const { badRequest, conflict, forbidden, notFound } = require('../utils/errors');

const ROLES_VALIDOS = Object.values(Rol);
/** Solo cuentas institucionales (RNF Seguridad). */
const EMAIL_INSTITUCIONAL = /^[^\s@]+@unadeca\.net$/i;

/**
 * Usuarios y roles.
 * Trazabilidad: RF-15 (acceso solo con cuenta activa), RF-16 (administración de cuentas),
 * RNF Seguridad (control de acceso basado en roles).
 */
class UserService {
  /** @param {{userRepo: import('../repositories/UserRepository')}} deps */
  constructor({ userRepo, authGateway }) {
    this.userRepo = userRepo;
    this.authGateway = authGateway;
  }

  /**
   * RF-16: el administrador crea una cuenta con su rol. La cuenta se crea sin contraseña
   * y se devuelve un enlace para que la persona defina la suya: el administrador nunca la conoce.
   */
  async crearCuenta({ nombre, email, rol } = {}) {
    if (typeof nombre !== 'string' || !nombre.trim() || nombre.length > 100) {
      throw badRequest('"nombre" es obligatorio (máximo 100 caracteres)');
    }
    if (typeof email !== 'string' || !EMAIL_INSTITUCIONAL.test(email.trim())) {
      throw badRequest('"email" debe ser una cuenta institucional @unadeca.net');
    }
    if (!ROLES_VALIDOS.includes(rol)) {
      throw badRequest(`Rol inválido. Valores permitidos: ${ROLES_VALIDOS.join(', ')}`);
    }
    const correo = email.trim().toLowerCase();
    let uid;
    try {
      uid = await this.authGateway.createUser({ email: correo, displayName: nombre.trim() });
    } catch (e) {
      if (e.code === 'auth/email-already-exists') throw conflict('Ya existe una cuenta con ese correo');
      throw e;
    }
    const usuario = await this.userRepo.save(uid, { nombre: nombre.trim(), email: correo, rol, activo: true });
    const enlaceContrasena = await this.authGateway.passwordSetupLink(correo);
    return { usuario, enlaceContrasena };
  }

  /**
   * Devuelve el perfil del usuario autenticado. Si inicia sesión por primera vez,
   * se crea con rol "estudiante": los roles superiores los asigna un administrador.
   */
  async obtenerOCrearPerfil({ uid, email, name }) {
    const existente = await this.userRepo.findById(uid);
    if (existente) return existente;
    return this.userRepo.save(uid, {
      nombre: name || email,
      email,
      rol: Rol.ESTUDIANTE,
      activo: true,
    });
  }

  /** El usuario solo puede cambiar su nombre: el rol y el estado los maneja el administrador. */
  async actualizarPerfil(uid, { nombre } = {}) {
    if (typeof nombre !== 'string' || !nombre.trim() || nombre.length > 100) {
      throw badRequest('"nombre" es obligatorio (máximo 100 caracteres)');
    }
    return this.userRepo.save(uid, { nombre: nombre.trim() });
  }

  listar() {
    return this.userRepo.findAll();
  }

  async cambiarRol(admin, userId, rol) {
    if (!ROLES_VALIDOS.includes(rol)) {
      throw badRequest(`Rol inválido. Valores permitidos: ${ROLES_VALIDOS.join(', ')}`);
    }
    if (admin.id === userId) throw forbidden('No puede cambiar su propio rol');
    if (!(await this.userRepo.findById(userId))) throw notFound('Usuario no encontrado');
    return this.userRepo.save(userId, { rol });
  }

  async cambiarActivo(admin, userId, activo) {
    if (typeof activo !== 'boolean') throw badRequest('"activo" debe ser true o false');
    if (admin.id === userId) throw forbidden('No puede desactivar su propia cuenta');
    if (!(await this.userRepo.findById(userId))) throw notFound('Usuario no encontrado');
    return this.userRepo.save(userId, { activo });
  }
}

module.exports = UserService;
