import nodemailer from 'nodemailer';

const escaparHtml = (valor) =>
  String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

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

export const enviarCorreoDocumentoDisponible = async (
  correoDestino,
  nombreTitular,
  descripcionDocumento,
  nombrePunto,
) => {
  const nombreSeguro = escaparHtml(nombreTitular);
  const descripcionSegura = escaparHtml(descripcionDocumento);
  const puntoSeguro = escaparHtml(nombrePunto);
  const mailOptions = {
    from: `"Sistema UBB" <${process.env.EMAIL_USER}>`,
    to: correoDestino,
    subject: 'Documento disponible para retirar',
    html: `
      <h2>Hola ${nombreSeguro}</h2>
      <p>Se encontró un documento registrado a tu nombre y ya está disponible para retiro.</p>
      <p><strong>Documento:</strong> ${descripcionSegura}</p>
      ${nombrePunto ? `<p><strong>Punto de entrega:</strong> ${puntoSeguro}</p>` : ''}
      <p>Acércate al punto de entrega correspondiente para continuar con el retiro.</p>
    `
  };

  await transporter.sendMail(mailOptions);
};