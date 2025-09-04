import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { config } from '../index.js';
import db from '../models/index.js';

/**
 * Passport.js configuration for ZoneWeaver
 * Phase 1: JWT Strategy (replacement for custom JWT middleware)
 */

// JWT Strategy - matches existing custom middleware behavior exactly
passport.use('jwt', new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: config.security.jwt_secret || 'fallback-secret',
  // Note: Not setting issuer/audience initially to maintain compatibility
}, async (payload, done) => {
  try {
    // Get fresh user data to ensure user is still active (matches existing logic)
    const { user: UserModel } = db;
    const user = await UserModel.findByPk(payload.userId);
    
    if (!user) {
      return done(null, false, { message: 'Invalid token - user not found' });
    }

    // Return user object in same format as existing middleware
    return done(null, {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    console.error('JWT Strategy error:', error);
    return done(error, false);
  }
}));

// Serialize/deserialize functions (required by passport but not used for JWT)
passport.serializeUser((user, done) => {
  done(null, user.userId);
});

passport.deserializeUser(async (userId, done) => {
  try {
    const { user: UserModel } = db;
    const user = await UserModel.findByPk(userId);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
