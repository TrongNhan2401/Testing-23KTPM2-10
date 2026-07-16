export interface LoginRequest {
    username: string;
    password: string;
}

export interface LoginResponse {
    token: string;
    expiresAt: string;
    user: {
        username: string;
        role: string;
    };
}

export interface JwtPayload {
    sub: string;
    username: string;
    role: string;
    iat: number;
    exp: number;
}
