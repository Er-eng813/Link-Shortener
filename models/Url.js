const mongoose = require("mongoose");

const UrlSchema = new mongoose.Schema({
  originalUrl: { type: String, required: true },
  shortCode: { type: String, required: true, unique: true },
  clicks: { type: Number, default: 0 },
  
  // ВОТ ОНА МАГИЯ: expires: 86400
  // 86400 секунд = ровно 24 часа. 
  // Через 24 часа MongoDB сама удалит эту строчку из базы!
  createdAt: { type: Date, default: Date.now, expires: 86400 } 
});

module.exports = mongoose.model("Url", UrlSchema);
