import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// This is a valid bcrypt hash for the test password: password.
const TEST_PASSWORD_HASH =
  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

const image = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=80`;

async function main() {
  const tx = prisma;

  // Delete dependants first so the seed can be run repeatedly.
  await tx.bitacora.deleteMany();
  await tx.foto.deleteMany();
  await tx.retiro.deleteMany();
  await tx.objeto.deleteMany();
  await tx.adminPuntoAsignacion.deleteMany();
  await tx.puntoEntrega.deleteMany();
  await tx.usuario.deleteMany();

    const users = await Promise.all([
      tx.usuario.create({
        data: {
          nombre: 'Ana Administradora',
          rut: '11.111.111-1',
          correo: 'ana.admin@ubb.cl',
          passwordHash: TEST_PASSWORD_HASH,
          rol: 'ADMIN_SISTEMA',
        },
      }),
      tx.usuario.create({
        data: {
          nombre: 'Bruno Encargado',
          rut: '22.222.222-2',
          correo: 'bruno.punto@ubb.cl',
          passwordHash: TEST_PASSWORD_HASH,
          rol: 'ADMIN_PUNTO',
        },
      }),
      tx.usuario.create({
        data: {
          nombre: 'Camila Pérez',
          rut: '19.876.543-2',
          correo: 'camila.perez@alumnos.ubb.cl',
          passwordHash: TEST_PASSWORD_HASH,
          rol: 'USUARIO_UBB',
        },
      }),
      tx.usuario.create({
        data: {
          nombre: 'Diego Soto',
          rut: '20.123.456-7',
          correo: 'diego.soto@alumnos.ubb.cl',
          passwordHash: TEST_PASSWORD_HASH,
          rol: 'USUARIO_UBB',
        },
      }),
    ]);

    const [adminSistema, adminPunto, camila, diego] = users;

    const [biblioteca, casino, edificioA] = await Promise.all([
      tx.puntoEntrega.create({
        data: {
          nombre: 'Punto Biblioteca',
          ubicacion: 'Biblioteca Central, primer piso',
        },
      }),
      tx.puntoEntrega.create({
        data: {
          nombre: 'Punto Casino',
          ubicacion: 'Casino UBB, acceso principal',
        },
      }),
      tx.puntoEntrega.create({
        data: {
          nombre: 'Punto Edificio A',
          ubicacion: 'Edificio A, mesón de informaciones',
        },
      }),
    ]);

    await tx.adminPuntoAsignacion.createMany({
      data: [
        { usuarioId: adminPunto.id, puntoId: biblioteca.id },
        { usuarioId: adminPunto.id, puntoId: casino.id },
        { usuarioId: adminSistema.id, puntoId: edificioA.id },
      ],
    });

    const objects = await Promise.all([
      tx.objeto.create({
        data: {
          categoria: 'DOCUMENTOS_Y_TARJETAS',
          descripcion: 'Cédula de identidad encontrada dentro de una funda azul.',
          lugarHallazgo: 'Biblioteca Central, sala 204',
          estado: 'PENDIENTE',
          titularRut: '18.765.432-1',
          titularNombre: 'Valentina González',
          puntoId: biblioteca.id,
          usuarioHalladorId: camila.id,
          fotos: {
            create: [
              { urlArchivo: image('photo-1554224155-6726b3ff858f') },
              { urlArchivo: image('photo-1589829545856-d10d557cf95f') },
            ],
          },
          bitacora: {
            create: { tipoOperacion: 'PRE_INSCRIPCION', usuarioId: camila.id },
          },
        },
      }),
      tx.objeto.create({
        data: {
          categoria: 'ELECTRONICA',
          descripcion: 'Notebook gris de 14 pulgadas con un adhesivo de ingeniería.',
          lugarHallazgo: 'Laboratorio de computación 3',
          estado: 'APROBADO',
          puntoId: edificioA.id,
          usuarioHalladorId: diego.id,
          fotos: {
            create: [{ urlArchivo: image('photo-1496181133206-80ce9b88a853') }],
          },
          bitacora: {
            create: [
              { tipoOperacion: 'PRE_INSCRIPCION', usuarioId: diego.id },
              { tipoOperacion: 'APROBACION', usuarioId: adminSistema.id },
            ],
          },
        },
      }),
      tx.objeto.create({
        data: {
          categoria: 'ROPA_Y_ACCESORIOS',
          descripcion: 'Mochila negra con un cuaderno de matemáticas en su interior.',
          lugarHallazgo: 'Casino, mesa cercana a la entrada',
          estado: 'ENTREGADO',
          puntoId: casino.id,
          usuarioHalladorId: camila.id,
          fotos: {
            create: [{ urlArchivo: image('photo-1553062407-98eeb64c6a62') }],
          },
          bitacora: {
            create: [
              { tipoOperacion: 'PRE_INSCRIPCION', usuarioId: camila.id },
              { tipoOperacion: 'APROBACION', usuarioId: adminPunto.id },
              { tipoOperacion: 'RETIRO', usuarioId: adminPunto.id },
            ],
          },
        },
      }),
      tx.objeto.create({
        data: {
          categoria: 'LLAVES',
          descripcion: 'Llavero con tres llaves y una cinta roja.',
          lugarHallazgo: 'Estacionamiento de bicicletas',
          estado: 'APROBADO',
          puntoId: biblioteca.id,
          usuarioHalladorId: diego.id,
          fotos: {
            create: [{ urlArchivo: image('photo-1582139329536-e7284fece509') }],
          },
          bitacora: {
            create: [
              { tipoOperacion: 'PRE_INSCRIPCION', usuarioId: diego.id },
              { tipoOperacion: 'APROBACION', usuarioId: adminPunto.id },
            ],
          },
        },
      }),
      tx.objeto.create({
        data: {
          categoria: 'UTILES_Y_MATERIAL_ESTUDIO',
          descripcion: 'Calculadora científica negra, modelo para ingeniería.',
          lugarHallazgo: 'Edificio A, sala 101',
          estado: 'PENDIENTE',
          puntoId: edificioA.id,
          usuarioHalladorId: camila.id,
          bitacora: {
            create: { tipoOperacion: 'PRE_INSCRIPCION', usuarioId: camila.id },
          },
        },
      }),
      tx.objeto.create({
        data: {
          categoria: 'OTROS',
          descripcion: 'Botella reutilizable azul con una calcomanía de montañas.',
          lugarHallazgo: 'Patio central',
          estado: 'ENTREGADO',
          puntoId: casino.id,
          usuarioHalladorId: diego.id,
          fotos: {
            create: [{ urlArchivo: image('photo-1602143407151-7111542de6e8') }],
          },
          bitacora: {
            create: [
              { tipoOperacion: 'PRE_INSCRIPCION', usuarioId: diego.id },
              { tipoOperacion: 'APROBACION', usuarioId: adminPunto.id },
              { tipoOperacion: 'RETIRO', usuarioId: adminPunto.id },
            ],
          },
        },
      }),
    ]);

    await tx.retiro.createMany({
      data: [
        {
          fechaRetiro: new Date('2026-09-29T15:30:00.000Z'),
          rutRetiro: camila.rut,
          objetoId: objects[2].id,
          adminEntregaId: adminPunto.id,
          usuarioRetiradorId: camila.id,
        },
        {
          fechaRetiro: new Date('2026-09-30T11:15:00.000Z'),
          rutRetiro: '17.654.321-0',
          objetoId: objects[5].id,
          adminEntregaId: adminPunto.id,
        },
      ],
    });
  console.log('Seed completado: 4 usuarios, 3 puntos y 6 objetos creados.');
  console.log('Contraseña de prueba para todos los usuarios: password');
}

main()
  .catch((error) => {
    console.error('No se pudo ejecutar el seed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });