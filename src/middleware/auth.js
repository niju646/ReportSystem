import { verifyAccessToken } from "../config/jwt.js";

export const authenticate = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Access denied: No token provided",
    });
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    if (!["admin", "teacher"].includes(decoded.role)) {
      return res.status(403).json({
        success: false,
        error: "Access denied: Insufficient permissions",
      });
    }
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: error.message,
    });
  }
};


// import { verifyToken } from "../config/jwt.js";

// export const authenticate = (req, res, next) => {
//   const authHeader = req.headers["authorization"];
//   const token = authHeader && authHeader.split(" ")[1]; // Expecting "Bearer <token>"

//   if (!token) {
//     return res.status(401).json({
//       success: false,
//       error: "Access denied: No token provided",
//     });
//   }

//   try {
//     const decoded = verifyToken(token);
//     req.user = decoded; // Attach decoded user info to request
//     if (!["admin", "teacher"].includes(decoded.role)) {
//       return res.status(403).json({
//         success: false,
//         error: "Access denied: Insufficient permissions",
//       });
//     }
//     next(); // Proceed to the route handler
//   } catch (error) {
//     res.status(401).json({
//       success: false,
//       error: error.message,
//     });
//   }
// };