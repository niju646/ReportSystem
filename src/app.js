import express from "express";
import dotenv from "dotenv";
import reportRoutes from "./routes/report.js";

dotenv.config();

const app = express();
app.use(express.json());

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