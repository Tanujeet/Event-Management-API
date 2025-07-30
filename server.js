require("dotenv").config();

const express = require("express");
const eventRoutes = require("./src/routes/event.routes");
const { errorHandler } = require("./src/middleware/errorHandler");

const app = express();

app.use(express.json());

app.use("/api", eventRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
