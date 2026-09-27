/**
 * Errors thrown by the service layer. Messages are written for end users:
 * server actions show them directly in the UI.
 */
export class AppError extends Error {
  constructor(
    message: string,
    readonly code: "NOT_FOUND" | "FORBIDDEN" | "CONFLICT" | "INVALID",
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class NotFoundError extends AppError {
  constructor(message = "We couldn't find what you were looking for.") {
    super(message, "NOT_FOUND");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You don't have permission to do that.") {
    super(message, "FORBIDDEN");
  }
}

/** A request that is valid in shape but not allowed in the current state. */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, "CONFLICT");
  }
}

export class InvalidInputError extends AppError {
  constructor(
    message: string,
    readonly fieldErrors: Record<string, string[]> = {},
  ) {
    super(message, "INVALID");
  }
}
