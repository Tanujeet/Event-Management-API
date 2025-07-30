const express = require("express");
const router = express.Router();
const eventController = require("../controllers/event.controller");

router.post("/events", eventController.createEvent);

router.get("/events/upcoming", eventController.listUpcomingEvents);

router.get("/events/:id", eventController.getEventById);

router.get("/events/:id/stats", eventController.getEventStats);

router.post("/events/:id/register", eventController.registerForEvent);

router.delete("/events/:id/register", eventController.cancelRegistration);

module.exports = router;
