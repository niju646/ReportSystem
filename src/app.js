import express from "express";
import dotenv from "dotenv";
import reportRoutes from "./routes/report.js";

dotenv.config();

const app = express();
app.use(express.json());

// Add CORS middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:5173"); // Frontend URL
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// API Routes
app.use("/api", reportRoutes);

// Health check
app.get("/", (req, res) => {
  res.send("Notification Report API is running");
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🌐 Report API running on port ${PORT}`);
});