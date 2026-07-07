/**
 * Standardized error response format for authentication errors
 */
export interface AuthErrorResponse {
    statusCode: number;
    error: string;
    messages: string[];
}
