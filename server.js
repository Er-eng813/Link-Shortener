require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const { nanoid } = require("nanoid");
const cors = require("cors");
const Url = require("./models/Url");

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static("public"));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

app.post("/shorten", async (req, res) => {
  try {
    // Теперь сервер принимает не только ссылку, но и желаемую длину
    const { originalUrl, customLength } = req.body;
    
    if (!originalUrl) return res.status(400).json({ error: "URL required" });
    
    // Если пользователь выбрал длину, используем её (но переводим в число). Если нет — по умолчанию 4.
    const length = customLength ? parseInt(customLength) : 4;
    
    // Генерируем код выбранной длины
    const shortCode = nanoid(length);
    
    const newUrl = new Url({ originalUrl, shortCode });
    await newUrl.save();
    
    res.json({ shortUrl: `http://localhost:${process.env.PORT}/${shortCode}` });
  } catch (err) {
    // Защита: если такой код уже случайно выпал (ошибка уникальности MongoDB)
    if (err.code === 11000) {
      return res.status(400).json({ error: "Коллизия! Попробуйте сгенерировать еще раз или увеличьте длину." });
    }
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/:code", async (req, res) => {
  const url = await Url.findOne({ shortCode: req.params.code });
  if (!url) return res.status(404).json({ error: "Link not found" });
  url.clicks++;
  await url.save();
  res.redirect(url.originalUrl);
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
