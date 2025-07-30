const { Prisma } = require("@prisma/client");

const handlePrismaError = (err, res) => {
  // P2002: Unique constraint violation (e.g., duplicate registration)
  if (err.code === "P2002") {
    const fields = err.meta?.target?.join(", ");
    return res.status(409).json({
      // 409 Conflict
      status: "fail",
      message: `Duplicate field value: ${fields}. This user is likely already registered for this event.`,
    });
  }

  // P2025: Record to delete not found (e.g., canceling a non-existent registration)
  if (err.code === "P2025") {
    return res.status(404).json({
      status: "fail",
      message:
        "Record not found. The user might not have been registered for this event.",
    });
  }

  // Generic Prisma error
  console.error("PRISMA ERROR:", err);
  return res.status(500).json({
    status: "error",
    message: "An internal database error occurred.",
  });
};

const errorHandler = (err, req, res, next) => {
  // Check if the error is a known Prisma error
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaError(err, res);
  }

  // Check for custom AppError
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      status: "fail",
      message: err.message,
    });
  }

  // Handle other, unexpected errors
  console.error("UNHANDLED ERROR:", err);
  res.status(500).json({
    status: "error",
    message: "An unexpected internal server error occurred.",
  });
};

module.exports = { errorHandler };
