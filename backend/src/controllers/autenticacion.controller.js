import bcrypt from 'bcrypt';
import crypto from 'crypto';
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

const crearTokenSesion = (usuario) => {
  const secreto = process.env.SESSION_SECRET;
  if (!secreto) {
    throw new Error('La variable SESSION_SECRET no está configurada');
  }

  const payload = Buffer.from(JSON.stringify({
    sub: usuario.id,
    rol: usuario.rol,
    exp: Date.now() + 8 * 60 * 60 * 1000
  })).toString('base64url');
  const firma = crypto
    .createHmac('sha256', secreto)
    .update(payload)
    .digest('base64url');

  return `${payload}.${firma}`;
};

export const registrarCuenta = async (req, res, next) => {
  try {
    const { nombre, rut, correo, password } = req.body;
    const correoNormalizado = correo.toLowerCase();

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

    // Hashear la contraseña antes de guardarla
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Generar un token de verificación único y establecer su expiración (24 horas)
    const tokenVerificacion = crypto.randomBytes(32).toString('hex');
    const expiracionToken = new Date();
    expiracionToken.setTime(expiracionToken.getTime() + DURACION_TOKEN_MS);

    // Crear el usuario en estado deshabilitado/inactivo
    const nuevoUsuario = await prisma.usuario.create({
      data: {
        nombre,
        rut,
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

    try {
      await enviarCorreoVerificacion(correoNormalizado, enlaceVerificacion);
    } catch (mailError) {
      await prisma.usuario.delete({ where: { id: nuevoUsuario.id } });
      throw mailError;
    }
    
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

// Verificar correo mediante token
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

export const iniciarSesion = async (req, res, next) => {
  try {
    const { correo, password } = req.body;
    const usuario = await prisma.usuario.findUnique({
      where: { correo }
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

// Reenviar correo de verificación
export const reenviarCorreoVerificacion = async (req, res, next) => {
  try {
    const { correo } = req.body;

    const usuario = await prisma.usuario.findUnique({
      where: { correo }
    });

    // Si el usuario no existe o ya está habilitado, respondemos sin revelar datos de seguridad
    if (!usuario) {
      return res.status(404).json({
        status: 'fail',
        message: 'No existe una cuenta registrada con este correo electrónico.'
      });
    }

    if (usuario.habilitado) {
      return res.status(400).json({
        status: 'fail',
        message: 'Esta cuenta ya se encuentra verificada e iniciada.'
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
    await enviarCorreoVerificacion(correo, enlaceVerificacion);

    return res.status(200).json({
      status: 'success',
      message: `Te hemos reenviado un nuevo correo de verificación a ${correo}`
    });

  } catch (error) {
    next(error);
  }
};