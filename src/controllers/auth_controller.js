import User from '../models/User.js';
import { sendRegistrationEmail, sendPasswordRecoveryEmail } from '../helpers/mail.js';
import { createJWT } from '../helpers/jwt.js';


export const registerUser = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    const data = {
      ...req.body,
      name: req.body.nombre || req.body.name
    };

    if (Object.values(data).includes('')) {
      return res.status(400).json({ msg: 'Lo sentimos, debes llenar todos los campos' });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      if (!existingUser.emailConfirmed) {
        const token = existingUser.token || existingUser.createToken();
        await existingUser.save();
        return res.status(200).json({
          msg: 'El usuario ya está registrado pero falta confirmar su cuenta.',
          token: token
        });
      }
      return res.status(400).json({ msg: 'Lo sentimos, el email ya se encuentra registrado y confirmado' });
    }

    const newUser = new User(data);
    newUser.password = await newUser.encryptPassword(password);
    const token = newUser.createToken();

    await sendRegistrationEmail(email, token);
    await newUser.save();
    res.status(201).json({
      msg: 'Usuario creado. Revisa tu correo electrónico para confirmar tu cuenta.',
      token: token
    });
  } catch (error) {
    console.error('Error en registerUser:', error);
    res.status(500).json({ msg: `Error en el servidor - ${error.message}` });
  }
};

export const confirmEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const userDB = await User.findOne({ token });

    if (!userDB) return res.status(404).json({ msg: 'Token inválido o ya usado' });

    userDB.token = null;
    userDB.emailConfirmed = true;
    await userDB.save();

    res.status(200).json({ msg: 'Cuenta confirmada, ya puedes iniciar sesión' });
  } catch (error) {
    res.status(500).json({ msg: `Error en el servidor - ${error.message}` });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ msg: 'Debes ingresar un correo electrónico' });

    const userDB = await User.findOne({ email });
    if (!userDB) return res.status(404).json({ msg: 'El usuario no se encuentra registrado' });

    const token = userDB.createToken();
    await userDB.save();

    await sendPasswordRecoveryEmail(email, token);

    res.status(200).json({
      msg: 'Revisa tu correo electrónico para restablecer tu cuenta',
      token: token
    });
  } catch (error) {
    res.status(500).json({ msg: `Error en el servidor - ${error.message}` });
  }
};

export const verifyPasswordToken = async (req, res) => {
  try {
    const { token } = req.params;

    const userDB = await User.findOne({ token });
    if (!userDB) return res.status(404).json({ msg: 'Lo sentimos, no se puede validar la cuenta' });

    res.status(200).json({ msg: 'Token confirmado, ya puedes crear tu nuevo password' });
  } catch (error) {
    res.status(500).json({ msg: `Error en el servidor - ${error.message}` });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmpassword } = req.body;

    if (Object.values(req.body).includes('')) {
      return res.status(400).json({ msg: 'Debes llenar todos los campos' });
    }
    if (password !== confirmpassword) {
      return res.status(400).json({ msg: 'Los passwords no coinciden' });
    }

    const userDB = await User.findOne({ token });
    if (!userDB) return res.status(404).json({ msg: 'No se puede validar la cuenta' });

    userDB.password = await userDB.encryptPassword(password);
    userDB.token = null;
    await userDB.save();

    res.status(200).json({ msg: 'Felicitaciones, ya puedes iniciar sesión con tu nuevo password' });
  } catch (error) {
    res.status(500).json({ msg: `Error en el servidor - ${error.message}` });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password, platform } = req.body;

    if (Object.values(req.body).includes('')) {
      return res.status(400).json({ msg: 'Debes llenar todos los campos' });
    }

    const userDB = await User.findOne({ email });
    if (!userDB) return res.status(404).json({ msg: 'El usuario no se encuentra registrado' });

    if (!userDB.emailConfirmed) {
      return res.status(403).json({ msg: 'Debes verificar la cuenta antes de iniciar sesión' });
    }

    const isPasswordCorrect = await userDB.matchPassword(password);
    if (!isPasswordCorrect) return res.status(401).json({ msg: 'El password no es correcto' });

    const token = createJWT(userDB._id, userDB.role, platform);

    res.status(200).json({
      token,
      nombre: userDB.name,
      name: userDB.name,
      rol: userDB.role,
      _id: userDB._id,
      email: userDB.email,
      avatarUrl: userDB.avatarUrl,
      preferences: userDB.preferences
    });
  } catch (error) {
    res.status(500).json({ msg: `Error en el servidor - ${error.message}` });
  }
};
