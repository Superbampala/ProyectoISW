export function devAuthMiddleware(req, res, next) {
  const userId = Number(req.header('x-user-id'));
  const userRole = req.header('x-user-role');

  const validRoles = [
    'USUARIO_UBB',
    'ADMIN_PUNTO',
    'ADMIN_SISTEMA'
  ];

  if (!Number.isInteger(userId) || !validRoles.includes(userRole)) {
    return res.status(401).json({
      error: 'Headers de autenticación inválidos'
    });
  }

  req.user = {
    id: userId,
    rol: userRole
  };

  next();
}