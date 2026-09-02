import cors from "cors";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { errorMiddleware } from "./common/middleware/error.middleware.js";
import authRoutes from "./modules/auth/auth.routes.js";
import chatRoutes from "./modules/chat/chat.routes.js";
import locationRoutes from "./modules/locations/location.routes.js";
import onboardingRoutes from "./modules/onboarding/onboarding.routes.js";

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDirectory = path.resolve(__dirname, "../public");

app.use(cors());
app.use(express.json());
app.use(express.static(publicDirectory));

app.get("/chat", (req, res) => {
  res.sendFile(path.join(publicDirectory, "chat.html"));
});

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Server is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/onboarding", onboardingRoutes);
app.use(errorMiddleware);

export default app;