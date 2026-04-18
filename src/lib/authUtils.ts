import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
}

/**
 * Middleware to authenticate requests and return user info
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    // Get the JWT token from the request
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET 
    });

    if (!token) {
      return null;
    }

    return {
      id: token.id as string,
      email: token.email as string,
      name: token.name as string,
    };
  } catch (error) {
    console.error("Authentication error:", error);
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export function requireAuth(user: AuthenticatedUser | null) {
  if (!user) {
    throw new Error("Authentication required");
  }
  return user;
}