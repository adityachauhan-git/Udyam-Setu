import { AppError } from "../errors/AppError.js";
import { verifyToken } from "../utils/jwt.js";

export function authenticate(req, res, next) {


    

  const authorization = req.headers.authorization;

  
  const [scheme, token] = authorization?.split(" ") ?? [];

  if (scheme !== "Bearer" || !token) {
    return next(new AppError("Authentication required", 401));
  }

  try {
    req.user = verifyToken(token);
    return next();
  } catch {
    return next(new AppError("Invalid or expired token", 401));
  }
}

