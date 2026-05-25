import jwt from 'jsonwebtoken';

export const createJWT = (id, role, platform = 'web') => {
  if (!process.env.JWT_SECRET) {
    throw new Error('CRITICAL: JWT_SECRET no está definido en las variables de entorno');
  }

  const expiresIn = platform === 'mobile' ? '365d' : '1d';

  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET,
    { expiresIn }
  );
};
