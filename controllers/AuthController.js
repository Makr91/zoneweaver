import { login, logout } from './auth/session.js';
import { verifyToken, getAuthMethods } from './auth/verify.js';

const AuthController = {
  login,
  logout,
  verifyToken,
  getAuthMethods,
};

export default AuthController;
