const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./MongoDb");
const testRoutes = require("./routes/testRoutes");
const cors = require("cors");

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/test", testRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port http://localhost:${PORT}`));
