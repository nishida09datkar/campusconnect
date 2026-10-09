import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { UserTokenPayload } from '../types/socket.js';

export function verifySocketAuth(jwtSecret: string) {
  return (socket: Socket, next: (err?: Error) => void) => {
    try {
      const authHeader = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
      if (!authHeader) {
        return next(new Error('Authentication error: Token missing from handshake auth'));
      }

      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim();
      if (!token) {
        return next(new Error('Authentication error: Empty token'));
      }

      let decoded: any = null;

      // Try UTF-8 string secret first
      try {
        decoded = jwt.verify(token, jwtSecret);
      } catch (e1) {
        // Try base64 decoded buffer (common in Java JJWT)
        try {
          const secretBuffer = Buffer.from(jwtSecret, 'base64');
          decoded = jwt.verify(token, secretBuffer);
        } catch (e2) {
          // Try hex decoded buffer
          try {
            const hexBuffer = Buffer.from(jwtSecret, 'hex');
            decoded = jwt.verify(token, hexBuffer);
          } catch (e3) {
            return next(new Error('Authentication error: Invalid or expired token'));
          }
        }
      }

      if (!decoded) {
        return next(new Error('Authentication error: Verification failed'));
      }

      // Spring Boot sets sub = email, custom claims: userId, role
      const userPayload: UserTokenPayload = {
        userId: decoded.userId || decoded.id || decoded.sub,
        email: decoded.email || decoded.sub,
        role: decoded.role || 'USER',
      };

      socket.data.user = userPayload;
      return next();
    } catch (err: any) {
      return next(new Error(`Authentication error: ${err.message}`));
    }
  };
}
