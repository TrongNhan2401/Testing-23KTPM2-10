export class AuthError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "AuthError";
    }
}

export class InvalidCredentialsError extends AuthError {
    constructor() {
        super("Invalid username or password");
        this.name = "InvalidCredentialsError";
    }
}

export class UnauthorizedError extends AuthError {
    constructor() {
        super("Authentication required");
        this.name = "UnauthorizedError";
    }
}

export class ForbiddenError extends AuthError {
    constructor() {
        super("Insufficient permissions");
        this.name = "ForbiddenError";
    }
}
