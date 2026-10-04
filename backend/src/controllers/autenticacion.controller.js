import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { prisma } from '../config/db.js'; // Tu instancia de Prisma Client

export const registrarCuenta = async (req, res, next) => {
  try {
    const { nombre, rut, correo, password } = req.body;

    // Verificar si el correo ya existe en la base de datos
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { correo }
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
    expiracionToken.setHours(expiracionToken.getHours() + 24);

    // Crear el usuario en estado deshabilitado/inactivo
    const nuevoUsuario = await prisma.usuario.create({
      data: {
        nombre,
        rut,
        correo,
        passwordHash: passwordHash,
        habilitado: false, // Permanece inactivo hasta verificar correo
        tokenVerificacion,
        expiracionToken
      }
    });

    // Construir el enlace de verificación que se enviará al correo del usuario
    const enlaceVerificacion = `http://localhost:3000/api/auth/verificar?token=${tokenVerificacion}`;
    
    // (Aquí llamarías a tu servicio de mailing para enviar enlaceVerificacion)
    console.log(`Enviar este enlace a ${correo}: ${enlaceVerificacion}`);
    
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

    // Caso 3: Éxito -> Habilitar la cuenta y limpiar los campos del token
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        habilitado: true,
        tokenVerificacion: null,
        expiracionToken: null
      }
    });

    return res.status(200).json({
      status: 'success',
      message: 'Correo verificado, ya puedes iniciar sesión.'
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
    nuevaExpiracion.setHours(nuevaExpiracion.getHours() + 24);

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        tokenVerificacion: nuevoToken,
        expiracionToken: nuevaExpiracion
      }
    });

    const enlaceVerificacion = `http://localhost:3000/api/auth/verificar?token=${nuevoToken}`;
    console.log(`[EMAIL SIMULATION] Reenviando enlace a ${correo}: ${enlaceVerificacion}`);

    return res.status(200).json({
      status: 'success',
      message: `Te hemos reenviado un nuevo correo de verificación a ${correo}`
    });

  } catch (error) {
    next(error);
  }
};