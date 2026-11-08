import crypto from 'node:crypto';
import prisma from '../config/prisma.js';

const ROLES_ADMINISTRATIVOS = ['ADMIN_SISTEMA'];

const obtenerToken = (req) => {
  const authorization = req.header('authorization');
  if (!authorization?.startsWith('Bearer ')) return null;
  return authorization.slice(7).trim();
};

const verificarToken = (token) => {
  const secreto = process.env.SESSION_SECRET;
  if (!secreto || !token) return null;

  const [payload, firma] = token.split('.');
  if (!payload || !firma) return null;

  const firmaEsperada = crypto
    .createHmac('sha256', secreto)
    .update(payload)
    .digest('base64url');

  if (
    firma.length !== firmaEsperada.length ||
    !crypto.timingSafeEqual(Buffer.from(firma), Buffer.from(firmaEsperada))
  ) {
    return null;
  }

  try {
    const datos = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!Number.isInteger(datos.sub) || !Number.isFinite(datos.exp) || datos.exp <= Date.now()) {
      return null;
    }
    return datos;
  } catch {
    return null;
  }
};

export const autenticarSesion = async (req, res, next) => {
  const datos = verificarToken(obtenerToken(req));
  if (!datos) {
    return res.status(401).json({
      status: 'fail',
      message: 'La sesión no es válida o ha expirado.'
    });
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: datos.sub },
    select: { id: true, nombre: true, correo: true, rol: true, habilitado: true }
  });

  if (!usuario || !usuario.habilitado) {
    return res.status(401).json({
      status: 'fail',
      message: 'La sesión no es válida o ha expirado.'
    });
  }

  req.user = usuario;
  next();
};

export const exigirRol = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.rol)) {
    return res.status(403).json({
      status: 'fail',
      message: 'No tienes permisos para realizar esta acción.'
    });
  }
  next();
};

export const rolesAdministrativos = ROLES_ADMINISTRATIVOS;
