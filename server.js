import jsonServer from 'json-server';
import express from 'express';
import multer from 'multer';
import path from 'path';
import cors from 'cors';
import fs from 'fs';
import { fileURLToPath } from 'url';

// ESMで __dirname を再現するための設定
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const PUBLIC_DIR = path.join(__dirname, 'public');
const UPLOAD_DIR = path.join(PUBLIC_DIR, 'images');

// 画像を保存するフォルダを作成
if (!fs.existsSync(UPLOAD_DIR)){
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

app.use(cors());

// ファイルの保存先とファイル名の設定
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({ storage: storage });

// 静止ファイル（画像）の提供
app.use(express.static(PUBLIC_DIR));

// 画像アップロード用のAPIエンドポイント
app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('画像ファイルがありません。');
  }
  const imagePath = `/images/${req.file.filename}`;
  res.json({ imagePath: imagePath });
});

// JSON Serverのルーター設定
const router = jsonServer.router(path.join(__dirname, 'db.json'));
const middlewares = jsonServer.defaults();

app.use(middlewares);
app.use(router);

app.listen(PORT, () => {
  console.log(`JSON Server with Image Upload is running on http://localhost:${PORT}`);
});