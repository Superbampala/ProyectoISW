import nodemailer from 'nodemailer';

// Configuración del transporter con Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS  
  }
});

// ENVIA EL ENLACE PARA VERIFICAR EL CORREO
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

export const enviarCorreoRecuperacion = async (correoDestino, enlace) => {
  const mailOptions = {
    from: `"Sistema UBB" <${process.env.EMAIL_USER}>`,
    to: correoDestino,
    subject: 'Restablece tu contraseña',
    html: `
      <h2>Recuperación de contraseña</h2>
      <p>Solicitaste restablecer tu contraseña. Usa el siguiente enlace:</p>
      <a href="${enlace}" style="padding: 10px 15px; background-color: #0056b3; color: white; text-decoration: none; border-radius: 5px;">
        Restablecer contraseña
      </a>
      <p>Este enlace expirará en 1 hora y solo puede usarse una vez.</p>
    `
  };

  await transporter.sendMail(mailOptions);
};