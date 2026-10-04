import bcrypt from 'bcrypt';
import { prisma } from '../config/db.js'; // Tu instancia de Prisma Client

export const registrarCuenta = async (req, res, next) => {
  try {
    const { nombre, rut, correo, password } = req.body;

    // 1. Verificar si el correo ya existe en la base de datos
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { correo }
    });

    if (usuarioExistente) {
      return res.status(400).json({
        status: 'fail',
        message: 'El correo ya se encuentra registrado en el sistema.'
      });
    }

    // 2. Hashear la contraseña antes de guardarla
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 3. Crear el usuario en estado deshabilitado/inactivo
    const nuevoUsuario = await prisma.usuario.create({
      data: {
        nombre,
        rut,
        correo,
        password: passwordHash,
        habilitado: false // Permanece inactivo hasta verificar correo
      }
    });

    // 4. (Opcional) Aquí generarías un token de activación y enviarías el correo de verificación
    // await enviarCorreoVerificacion(nuevoUsuario.correo, token);

    // 5. Respuesta según el requerimiento
    return res.status(201).json({
      status: 'success',
      message: `Te enviamos un correo de verificación a ${nuevoUsuario.correo}`
    });

  } catch (error) {
    // Pasa el error al middleware de errores centralizado
    next(error);
  }
};