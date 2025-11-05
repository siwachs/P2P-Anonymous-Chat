import dotenv from "dotenv";

dotenv.config();

export const config = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "8000"),
  CORS_URL: process.env.CORS_URL || "http://localhost:5173",
};
