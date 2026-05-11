import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../../../../frontend/public/data");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `upload-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

export const uploadRouter = Router();

uploadRouter.post("/upload", upload.single("photo"), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "Файл не загружен" });
    return;
  }
  const filePath = `/data/${req.file.filename}`;
  res.json({ filePath });
});