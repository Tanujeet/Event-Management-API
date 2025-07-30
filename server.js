const express = require("express");
require("dotenv").config();

const app = express();
const eventRoutes = require("./src/routes/event.routes");
const { errorHandler } = require("./src/middleware/errorHandler");

app.use(express.json()); // Middleware to parse JSON bodies

// Main route
app.use("/api/events", eventRoutes);

// Central error handler
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
