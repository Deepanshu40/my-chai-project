import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.json({ limit: "16kb" }));
app.use(cookieParser());

// routes
import userRouter from "./routes/user.router.js";

// routes declaration
app.use("/api/v1/users", userRouter);

// app.use((error, req, res, next) => {

// })
export { app };