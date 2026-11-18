import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';
import { enviarCorreoVerificacion } from '../utils/mailer.js'; // Ajusta la ruta según la ubicación de tu archivo mailer

const crearLinkVerificacion = (token) => {
  const frontendUrl = process.env.FRONTEND_URL?.replace(/\/$/, '');

  if (!frontendUrl) {
    throw new Error('La variable FRONTEND_URL no está configurada');
  }

  return `${frontendUrl}/verificar-correo?token=${encodeURIComponent(token)}`;
};

const DURACION_TOKEN_MS = 24 * 60 * 60 * 1000;
const MENSAJE_CREDENCIALES_INVALIDAS = 'correo o contraseña incorrectos';
const MENSAJE_REENVIO_VERIFICACION =
  'Si existe una cuenta pendiente de verificar con ese correo, te enviaremos un nuevo enlace.';
const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const DOMINIOS_INSTITUCIONALES = ['@ubiobio.cl', '@alumnos.ubiobio.cl'];

const esCorreoInstitucional = (correo) =>
  DOMINIOS_INSTITUCIONALES.some((dominio) => correo.endsWith(dominio));

const enviarCorreoSinBloquear = (correo, enlace) => {
  setImmediate(async () => {
    try {
      await enviarCorreoVerificacion(correo, enlace);
    } catch (error) {
      console.error('ERROR_ENVIO_CORREO_VERIFICACION', {
        correo,
        mensaje: error.message,
        fecha: new Date().toISOString()
      });
    }
  });
};

// CREA UNA SESION FIRMADA CON EL ID, ROL Y VENCIMIENTO DEL USUARIO
const crearTokenSesion = (usuario) => {
  if (!JWT_SECRET) {
    throw new Error('La variable JWT_SECRET no está configurada');
  }

  return jwt.sign({
    sub: usuario.id,
    id: usuario.id,
    email: usuario.correo,
    rol: usuario.rol,
  }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// REGISTRA LA CUENTA, GUARDA LA CONTRASEÑA CON HASH Y ENVIA VERIFICACION
export const registrarCuenta = async (req, res, next) => {
  try {
    const { nombre, rut, correo, password } = req.body;
    const nombreNormalizado = nombre.trim();
    const rutNormalizado = rut.trim();
    const correoNormalizado = correo.trim().toLowerCase();

    if (!esCorreoInstitucional(correoNormalizado)) {
      return res.status(400).json({
        status: 'fail',
        message: 'El correo debe pertenecer al dominio institucional (@ubiobio.cl o @alumnos.ubiobio.cl)'
      });
    }

    // Verificar si el correo ya existe en la base de datos
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { correo: correoNormalizado }
    });

    if (usuarioExistente) {
      return res.status(400).json({
        status: 'fail',
        message: 'El correo ya se encuentra registrado en el sistema.'
      });
    }

    const rutExistente = await prisma.usuario.findUnique({
      where: { rut: rutNormalizado }
    });

    if (rutExistente) {
      return res.status(400).json({
        status: 'fail',
        message: 'El RUT ya se encuentra registrado en el sistema.'
      });
    }

    // Hashear la contraseña antes de guardarla
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Generar un token de verificación único y establecer su expiración (24 horas)
    const tokenVerificacion = crypto.randomBytes(32).toString('hex');
    const expiracionToken = new Date();
    expiracionToken.setTime(expiracionToken.getTime() + DURACION_TOKEN_MS);

    // Crear el usuario en estado deshabilitado
    const nuevoUsuario = await prisma.usuario.create({
      data: {
        nombre: nombreNormalizado,
        rut: rutNormalizado,
        correo: correoNormalizado,
        passwordHash: passwordHash,
        habilitado: false, // Permanece inactivo hasta verificar correo
        tokenVerificacion,
        expiracionToken,
        rol: 'USUARIO_UBB' // Asignar rol por defecto
      }
    });

    // Construir el enlace de verificación que se enviará al correo del usuario
    const enlaceVerificacion = crearLinkVerificacion(tokenVerificacion);

    enviarCorreoSinBloquear(correoNormalizado, enlaceVerificacion);
    
    // Respuesta según el requerimiento
    return res.status(201).json({
      status: 'success',
      message: `Te enviamos un correo de verificación a ${nuevoUsuario.correo}`
    });

  } catch (error) {
    // Pasa el error al error.middleware 
    next(error);
  }
};

// VERIFICA EL CORREO, HABILITA LA CUENTA Y CONSUME EL TOKEN
export const verificarCorreo = async (req, res, next) => {
  try {
    const { token } = req.query;

    // Buscar al usuario que posea este token
    const usuario = await prisma.usuario.findUnique({
      where: { tokenVerificacion: token }
    });

    // Caso 1: El enlace ya se usó o el token no existe
    if (!usuario) {
      return res.status(400).json({
        status: 'fail',
        message: 'El enlace de verificación es inválido o ya ha sido utilizado. Si aún no activas tu cuenta, solicita un nuevo correo.'
      });
    }

    // Caso 2: El enlace venció
    const ahora = new Date();
    if (usuario.expiracionToken && usuario.expiracionToken < ahora) {
      return res.status(400).json({
        status: 'fail',
        code: 'TOKEN_EXPIRED',
        message: 'El enlace de verificación ha caducado. Por favor, solicita el reenvío del correo.'
      });
    }

    // La condición del token hace que dos solicitudes concurrentes no puedan
    // habilitar la cuenta usando el mismo enlace.
    const actualizacion = await prisma.usuario.updateMany({
      where: {
        id: usuario.id,
        tokenVerificacion: token,
        habilitado: false
      },
      data: {
        habilitado: true,
        tokenVerificacion: null,
        expiracionToken: null
      }
    });

    if (actualizacion.count !== 1) {
      return res.status(400).json({
        status: 'fail',
        message: 'El enlace de verificación es inválido o ya ha sido utilizado. Si aún no activas tu cuenta, solicita un nuevo correo.'
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Correo verificado, ya puedes iniciar sesión.'
    });

  } catch (error) {
    next(error);
  }
};

// AUTENTICA AL USUARIO Y ENTREGA UNA SESION SI SU CUENTA ESTA HABILITADA
export const iniciarSesion = async (req, res, next) => {
  try {
    const { correo, password } = req.body;
    const correoNormalizado = correo.trim().toLowerCase();
    const usuario = await prisma.usuario.findUnique({
      where: { correo: correoNormalizado }
    });

    if (!usuario || !(await bcrypt.compare(password, usuario.passwordHash))) {
      return res.status(401).json({
        status: 'fail',
        message: MENSAJE_CREDENCIALES_INVALIDAS
      });
    }

    if (!usuario.habilitado) {
      return res.status(403).json({
        status: 'fail',
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Debes verificar tu correo antes de iniciar sesión.'
      });
    }

    const token = crearTokenSesion(usuario);
    return res.status(200).json({
      status: 'success',
      message: 'Inicio de sesión exitoso.',
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol
      }
    });
  } catch (error) {
    next(error);
  }
};

// DEVUELVE EL PERFIL DEL USUARIO ASOCIADO A LA SESION JWT
export const obtenerPerfil = (req, res) => {
  return res.status(200).json({
    status: 'success',
    usuario: req.user
  });
};

// LISTA USUARIOS PARA LA ADMINISTRACION DEL SISTEMA
export const listarUsuarios = async (req, res, next) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        nombre: true,
        rut: true,
        correo: true,
        rol: true,
        habilitado: true
      },
      orderBy: { nombre: 'asc' }
    });
    return res.status(200).json({ status: 'success', usuarios });
  } catch (error) {
    next(error);
  }
};

// ACTUALIZA EL ROL DE UN USUARIO ADMINISTRADOR
export const actualizarRol = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { rol } = req.body;

    if (id === req.user.id && rol !== 'ADMIN_SISTEMA') {
      return res.status(400).json({
        status: 'fail',
        message: 'No puedes quitarte el rol de ADMIN_SISTEMA a ti mismo.'
      });
    }

    const usuario = await prisma.usuario.update({
      where: { id },
      data: { rol },
      select: {
        id: true,
        nombre: true,
        correo: true,
        rol: true,
        habilitado: true
      }
    });

    return res.status(200).json({
      status: 'success',
      message: `El usuario ahora tiene el rol ${usuario.rol}.`,
      usuario
    });
  } catch (error) {
    next(error);
  }
};

// GENERA Y ENVIA UN NUEVO ENLACE DE VERIFICACION
export const reenviarCorreoVerificacion = async (req, res, next) => {
  try {
    const { correo } = req.body;
    const correoNormalizado = correo.trim().toLowerCase();

    const usuario = await prisma.usuario.findUnique({
      where: { correo: correoNormalizado }
    });

    // Respuesta uniforme: no revelar si existe una cuenta ni si ya fue habilitada.
    if (!usuario || usuario.habilitado) {
      return res.status(200).json({
        status: 'success',
        message: MENSAJE_REENVIO_VERIFICACION
      });
    }

    // Generar nuevo token y nueva expiración (ejemplo: 24 horas)
    const nuevoToken = crypto.randomBytes(32).toString('hex');
    const nuevaExpiracion = new Date();
    nuevaExpiracion.setTime(nuevaExpiracion.getTime() + DURACION_TOKEN_MS);

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        tokenVerificacion: nuevoToken,
        expiracionToken: nuevaExpiracion
      }
    });

    // Construir nuevo enlace
    const enlaceVerificacion = crearLinkVerificacion(nuevoToken);
    enviarCorreoSinBloquear(correoNormalizado, enlaceVerificacion);

    return res.status(200).json({
      status: 'success',
      message: MENSAJE_REENVIO_VERIFICACION
    });

  } catch (error) {
    next(error);
  }
};