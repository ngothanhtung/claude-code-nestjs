/**
 * Interface for user role in the authentication context
 */
export interface AuthUserRole {
    id: string;
    name: string;
}

/**
 * Interface for authenticated user object attached to request
 */
export interface AuthUser {
    id: string;
    email: string;
    username: string;
    roles?: AuthUserRole[];
}
