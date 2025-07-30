const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Custom error class for cleaner error handling
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

// Wrapper for async functions to catch errors
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// 1. Create a new event
exports.createEvent = catchAsync(async (req, res, next) => {
  const { title, dateTime, location, capacity } = req.body;

  // --- Input Validation ---
  if (!title || !dateTime || !location || !capacity) {
    return next(
      new AppError(
        "Please provide all required fields: title, dateTime, location, capacity.",
        400
      )
    );
  }
  if (
    typeof capacity !== "number" ||
    !Number.isInteger(capacity) ||
    capacity <= 0 ||
    capacity > 1000
  ) {
    return next(
      new AppError(
        "Capacity must be a positive integer less than or equal to 1000.",
        400
      )
    );
  }
  if (isNaN(new Date(dateTime).getTime())) {
    return next(new AppError("Invalid ISO format for dateTime.", 400));
  }

  const event = await prisma.event.create({
    data: {
      title,
      dateTime: new Date(dateTime),
      location,
      capacity,
    },
  });

  res.status(201).json({
    status: "success",
    message: "Event created successfully.",
    eventId: event.id,
  });
});

// 2. Get details for a specific event, including registered users
exports.getEventById = catchAsync(async (req, res, next) => {
  const eventId = parseInt(req.params.id);

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      registrations: {
        include: {
          user: {
            select: { id: true, name: true, email: true }, // Only return public user info
          },
        },
      },
    },
  });

  if (!event) {
    return next(new AppError("No event found with that ID.", 404));
  }

  // Map registrations to a cleaner user list
  const registeredUsers = event.registrations.map((reg) => reg.user);

  res.status(200).json({
    status: "success",
    data: {
      id: event.id,
      title: event.title,
      dateTime: event.dateTime,
      location: event.location,
      capacity: event.capacity,
      registeredUsers: registeredUsers,
    },
  });
});

// 3. Register a user for an event
exports.registerForEvent = catchAsync(async (req, res, next) => {
  const eventId = parseInt(req.params.id);
  const { userId } = req.body;

  if (!userId) {
    return next(new AppError("User ID is required for registration.", 400));
  }

  // Use a transaction to ensure atomicity (all or nothing)
  const result = await prisma.$transaction(async (tx) => {
    // Step 1: Find the event and lock it for the transaction
    const event = await tx.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new AppError("No event found with that ID.", 404);
    }

    // Step 2: Check if the event is in the past
    if (new Date(event.dateTime) < new Date()) {
      throw new AppError("Cannot register for a past event.", 400);
    }

    // Step 3: Check if the event is at full capacity
    const registrationCount = await tx.registration.count({
      where: { eventId: eventId },
    });

    if (registrationCount >= event.capacity) {
      throw new AppError("Event is at full capacity.", 400);
    }

    // Step 4: Create the registration. Prisma's unique constraint on @@id([userId, eventId])
    // will automatically prevent duplicate registrations and throw an error.
    await tx.registration.create({
      data: {
        userId: userId,
        eventId: eventId,
      },
    });
  });

  res.status(201).json({
    status: "success",
    message: "User registered for the event successfully.",
  });
});

// 4. Cancel a user's registration
exports.cancelRegistration = catchAsync(async (req, res, next) => {
  const eventId = parseInt(req.params.id);
  const { userId } = req.body;

  if (!userId) {
    return next(
      new AppError("User ID is required to cancel a registration.", 400)
    );
  }

  // The composite key `userId_eventId` is automatically created by Prisma
  await prisma.registration.delete({
    where: {
      userId_eventId: {
        userId: userId,
        eventId: eventId,
      },
    },
  });

  res.status(204).send(); // 204 No Content is standard for successful DELETE
});

// 5. List all upcoming events
exports.listUpcomingEvents = catchAsync(async (req, res, next) => {
  const upcomingEvents = await prisma.event.findMany({
    where: {
      dateTime: {
        gt: new Date(), // 'gt' means "greater than"
      },
    },
    // Custom sorting as required
    orderBy: [
      { dateTime: "asc" }, // First by date (ascending)
      { location: "asc" }, // Then by location (alphabetically)
    ],
  });

  res.status(200).json({
    status: "success",
    results: upcomingEvents.length,
    data: {
      events: upcomingEvents,
    },
  });
});

// 6. Get event statistics
exports.getEventStats = catchAsync(async (req, res, next) => {
  const eventId = parseInt(req.params.id);

  // Fetch event and the count of its registrations in one go
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      _count: {
        select: { registrations: true },
      },
    },
  });

  if (!event) {
    return next(new AppError("No event found with that ID.", 404));
  }

  const totalRegistrations = event._count.registrations;
  const remainingCapacity = event.capacity - totalRegistrations;
  const percentageUsed =
    event.capacity > 0 ? (totalRegistrations / event.capacity) * 100 : 0;

  res.status(200).json({
    status: "success",
    data: {
      totalRegistrations,
      remainingCapacity,
      percentageCapacityUsed: parseFloat(percentageUsed.toFixed(2)),
    },
  });
});
