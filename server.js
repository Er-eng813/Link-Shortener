require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const { nanoid } = require("nanoid");
const cors = require("cors");
const path = require("path");
const Url = require("./models/Url");

const app = express();

// 🔴 ДОБАВЛЕНО ДЛЯ RENDER: Говорим серверу доверять прокси-заголовкам
app.set('trust proxy', 1);

const PORT = process.env.PORT || 3000;
const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI;

app.use(express.json());
app.use(cors());
app.use(express.static("public"));

mongoose.connect(mongoURI)
  .then(() => console.log("✅ База данных подключена"))
  .catch(err => console.error("❌ Ошибка БД:", err));

app.post("/shorten", async (req, res) => {
  try {
    const { originalUrl, customLength } = req.body;
    if (!originalUrl) return res.status(400).json({ error: "URL обязателен" });

    const length = customLength ? parseInt(customLength) : 4;
    const shortCode = nanoid(length);
    const newUrl = new Url({ originalUrl, shortCode });
    await newUrl.save();

    // 🔴 УМНАЯ ГЕНЕРАЦИЯ ССЫЛКИ: 
    // Читаем реальный домен (onrender.com), который передает балансировщик Render
    const host = req.headers['x-forwarded-host'] || req.get("host");
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    
    const fullShortUrl = `${protocol}://${host}/${shortCode}`;

    res.json({ shortUrl: fullShortUrl });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: "Код занят" });
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

app.get("/:code", async (req, res) => {
  try {
    const url = await Url.findOne({ shortCode: req.params.code });
    if (url) {
      url.clicks = (url.clicks || 0) + 1;
      await url.save();
      return res.redirect(url.originalUrl);
    }
    res.status(404).send("<h1>Ссылка не найдена</h1>");
  } catch (err) {
    res.status(500).send("Ошибка сервера");
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
});
