// filepath: CarShopBackend/server.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const multer = require("multer");
const carRoutes = require("./routes/cars");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

app.use("/api/cars", carRoutes);
app.post("/api/cars", upload.single("img"), carRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Add a health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));