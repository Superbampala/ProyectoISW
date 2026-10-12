import nodemailer from 'nodemailer';

// Configuración del transporter con Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Tu correo gmail (ej: mi.proyecto@gmail.com)
    pass: process.env.EMAIL_PASS  // La contraseña de aplicación de 16 caracteres
  }
});

/**
 * Envía el correo de verificación al usuario
 */
export const enviarCorreoVerificacion = async (correoDestino, enlace) => {
  const mailOptions = {
    from: `"Sistema UBB" <${process.env.EMAIL_USER}>`,
    to: correoDestino,
    subject: 'Verifica tu cuenta de correo',
    html: `
      <h2>¡Bienvenido al sistema!</h2>
      <p>Para activar tu cuenta, haz clic en el siguiente enlace:</p>
      <a href="${enlace}" style="padding: 10px 15px; background-color: #0056b3; color: white; text-decoration: none; border-radius: 5px;">
        Verificar mi correo
      </a>
      <p>Este enlace expirará en 24 horas.</p>
    `
  };

  await transporter.sendMail(mailOptions);
};