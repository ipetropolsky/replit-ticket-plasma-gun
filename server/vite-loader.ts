import express, { type Express } from "express";
import { type Server } from "http";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  if (process.env.NODE_ENV === "development") {
    const { setupVite } = await import("./vite");
    await setupVite(app, server);
  } else {
    throw new Error("setupVite should only be called in development mode");
  }
}

export async function serveStatic(app: Express) {
  if (process.env.NODE_ENV === "production") {
    const { serveStatic } = await import("./vite");
    serveStatic(app);
  } else {
    throw new Error("serveStatic should only be called in production mode");
  }
}