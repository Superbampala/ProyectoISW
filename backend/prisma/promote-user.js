import 'dotenv/config';
import prisma from '../src/config/prisma.js';

const [correo, rol = 'ADMIN_SISTEMA'] = process.argv.slice(2);
const rolesValidos = ['USUARIO_UBB', 'ADMIN_PUNTO', 'ADMIN_SISTEMA'];

if (!correo || !rolesValidos.includes(rol)) {
  console.error('Uso: npm run promote:user -- correo@ubiobio.cl [USUARIO_UBB|ADMIN_PUNTO|ADMIN_SISTEMA]');
  process.exitCode = 1;
} else {
  try {
    const usuario = await prisma.usuario.update({
      where: { correo: correo.toLowerCase() },
      data: { rol },
      select: { id: true, nombre: true, correo: true, rol: true, habilitado: true }
    });

    console.log(`Rol actualizado: ${usuario.correo} -> ${usuario.rol}`);
    if (!usuario.habilitado) {
      console.warn('Advertencia: la cuenta aún no está verificada.');
    }
  } catch (error) {
    if (error.code === 'P2025') {
      console.error('No existe una cuenta con ese correo.');
    } else {
      console.error('No fue posible actualizar el rol:', error.message);
    }
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}
