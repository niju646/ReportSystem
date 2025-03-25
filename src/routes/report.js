// src/routes/report.js (backend)
import express from "express";
import db from "../config/db.js";
import { authenticate } from "../middleware/auth.js";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, revokeRefreshToken } from "../config/jwt.js";

const router = express.Router();

// GET /report/:notificationId - Fetch status report (protected)
router.get("/report/:notificationId", authenticate, async (req, res) => {
  const { notificationId } = req.params;

  // Validate notificationId
  const parsedId = parseInt(notificationId);
  if (isNaN(parsedId) || parsedId <= 0) {
    return res.status(400).json({
      success: false,
      error: "Invalid notification ID. It must be a positive integer.",
    });
  }

  try {
    const { rows } = await db.query(
      "SELECT type, recipient, message_sid, status, date_updated, error_message FROM status_logs WHERE notification_id = $1 ORDER BY date_updated DESC",
      [parsedId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No status records found for notification ID ${parsedId}`,
      });
    }

    const report = {
      notificationId: parsedId,
      statuses: rows.map(row => ({
        type: row.type,
        recipient: row.recipient,
        messageSid: row.message_sid,
        status: row.status,
        dateUpdated: row.date_updated.toISOString(),
        errorMessage: row.error_message || null,
      })),
      total: rows.length,
      summary: {
        delivered: rows.filter(r => r.status === "delivered" || r.status === "read").length,
        sent: rows.filter(r => r.status === "sent").length,
        failed: rows.filter(r => r.status === "failed").length,
        pending: rows.filter(r => ["queued", "sending"].includes(r.status)).length,
      },
    };

    res.json({
      success: true,
      data: report,
      user: { id: req.user.id, role: req.user.role },
    });
  } catch (error) {
    console.error(`❌ Error fetching report for notification ${parsedId}:`, error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// POST /login - Generate access and refresh tokens
router.post("/login", async (req, res) => {
  const { id, role } = req.body;
  if (!id || !["admin", "teacher"].includes(role)) {
    return res.status(400).json({ success: false, error: "Invalid credentials" });
  }

  const user = { id, role };
  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user);

  res.json({
    success: true,
    accessToken,
    refreshToken,
  });
});

// POST /refresh - Refresh access token using refresh token
router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      error: "Refresh token required",
    });
  }

  try {
    const decoded = await verifyRefreshToken(refreshToken);
    const user = { id: decoded.id, role: decoded.role };
    const newAccessToken = generateAccessToken(user);

    res.json({
      success: true,
      accessToken: newAccessToken,
      refreshToken,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: error.message,
    });
  }
});

// POST /logout - Revoke refresh token
router.post("/logout", authenticate, async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ success: false, error: "Refresh token required" });
  }

  try {
    await revokeRefreshToken(refreshToken);
    res.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to revoke token",
    });
  }
});

export default router;



// import express from "express";
// import db from "../config/db.js";
// import { authenticate } from "../middleware/auth.js";
// import { generateAccessToken, generateRefreshToken, verifyRefreshToken, revokeRefreshToken } from "../config/jwt.js";

// const router = express.Router();

// // GET /report/:notificationId - Fetch status report (protected)
// router.get("/report/:notificationId", authenticate, async (req, res) => {
//   const { notificationId } = req.params;

//   try {
//     const { rows } = await db.query(
//       "SELECT type, recipient, message_sid, status, date_updated, error_message FROM status_logs WHERE notification_id = $1 ORDER BY date_updated DESC",
//       [notificationId]
//     );

//     if (rows.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: `No status records found for notification ID ${notificationId}`,
//       });
//     }

//     const report = {
//       notificationId: parseInt(notificationId),
//       statuses: rows.map(row => ({
//         type: row.type,
//         recipient: row.recipient,
//         messageSid: row.message_sid,
//         status: row.status,
//         dateUpdated: row.date_updated.toISOString(),
//         errorMessage: row.error_message || null,
//       })),
//       total: rows.length,
//       summary: {
//         delivered: rows.filter(r => r.status === "delivered" || r.status === "read").length,
//         sent: rows.filter(r => r.status === "sent").length,
//         failed: rows.filter(r => r.status === "failed").length,
//         pending: rows.filter(r => ["queued", "sending"].includes(r.status)).length,
//       },
//     };

//     res.json({
//       success: true,
//       data: report,
//       user: { id: req.user.id, role: req.user.role },
//     });
//   } catch (error) {
//     console.error(`❌ Error fetching report for notification ${notificationId}:`, error);
//     res.status(500).json({
//       success: false,
//       error: "Internal server error",
//     });
//   }
// });

// // POST /login - Generate access and refresh tokens
// router.post("/login", async (req, res) => {
//   const { id, role } = req.body; // In practice, validate against a user DB
//   if (!id || !["admin", "teacher"].includes(role)) {
//     return res.status(400).json({ success: false, error: "Invalid credentials" });
//   }

//   const user = { id, role };
//   const accessToken = generateAccessToken(user);
//   const refreshToken = await generateRefreshToken(user);

//   res.json({
//     success: true,
//     accessToken,
//     refreshToken,
//   });
// });

// // POST /refresh - Refresh access token using refresh token
// router.post("/refresh", async (req, res) => {
//   const { refreshToken } = req.body;

//   if (!refreshToken) {
//     return res.status(401).json({
//       success: false,
//       error: "Refresh token required",
//     });
//   }

//   try {
//     const decoded = await verifyRefreshToken(refreshToken);
//     const user = { id: decoded.id, role: decoded.role };
//     const newAccessToken = generateAccessToken(user);

//     res.json({
//       success: true,
//       accessToken: newAccessToken,
//       refreshToken, // Return same refresh token (or generate new one if desired)
//     });
//   } catch (error) {
//     res.status(401).json({
//       success: false,
//       error: error.message,
//     });
//   }
// });

// // POST /logout - Revoke refresh token (optional)
// router.post("/logout", authenticate, async (req, res) => {
//   const { refreshToken } = req.body;

//   if (!refreshToken) {
//     return res.status(400).json({ success: false, error: "Refresh token required" });
//   }

//   try {
//     await revokeRefreshToken(refreshToken);
//     res.json({ success: true, message: "Logged out successfully" });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       error: "Failed to revoke token",
//     });
//   }
// });

// export default router;


// import express from "express";
// import db from "../config/db.js";
// import { authenticate } from "../middleware/auth.js";
// import {generateToken} from "../config/jwt.js"

// const router = express.Router();

// // GET /report/:notificationId - Fetch status report (protected)
// router.get("/report/:notificationId", authenticate, async (req, res) => {
//   const { notificationId } = req.params;

//   try {
//     const { rows } = await db.query(
//       "SELECT type, recipient, message_sid, status, date_updated, error_message FROM status_logs WHERE notification_id = $1 ORDER BY date_updated DESC",
//       [notificationId]
//     );

//     if (rows.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: `No status records found for notification ID ${notificationId}`,
//       });
//     }

//     const report = {
//       notificationId: parseInt(notificationId),
//       statuses: rows.map(row => ({
//         type: row.type,
//         recipient: row.recipient,
//         messageSid: row.message_sid,
//         status: row.status,
//         dateUpdated: row.date_updated.toISOString(),
//         errorMessage: row.error_message || null,
//       })),
//       total: rows.length,
//       summary: {
//         delivered: rows.filter(r => r.status === "delivered" || r.status === "read").length,
//         sent: rows.filter(r => r.status === "sent").length,
//         failed: rows.filter(r => r.status === "failed").length,
//         pending: rows.filter(r => ["queued", "sending"].includes(r.status)).length,
//       },
//     };

//     res.json({
//       success: true,
//       data: report,
//       user: { id: req.user.id, role: req.user.role }, // Optional: Include user info
//     });
//   } catch (error) {
//     console.error(`❌ Error fetching report for notification ${notificationId}:`, error);
//     res.status(500).json({
//       success: false,
//       error: "Internal server error",
//     });
//   }
// });

// // Optional: Login route to generate a token (for testing)
// router.post("/login", (req, res) => {
//   const { id, role } = req.body; // Simulate user input; in practice, validate against a DB
//   if (!id || !["admin", "teacher"].includes(role)) {
//     return res.status(400).json({ success: false, error: "Invalid credentials" });
//   }

//   const token = generateToken({ id, role });
//   res.json({ success: true, token });
// });

// export default router;