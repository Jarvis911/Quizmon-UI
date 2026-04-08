import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Checks if the user is authenticated.
 * If not, redirects to the login page.
 * @returns {boolean} true if authenticated, false otherwise.
 */
export function checkAuth(): boolean {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/login";
        return false;
    }
    return true;
}

/**
 * Sanitizes error messages by filtering out technical details and returning a user-friendly fallback.
 * Original error is logged to the console for development debugging.
 */
export function sanitizeError(err: any, fallback: string): string {
    console.error("Original Error Trace:", err);
    
    const rawMessage = err.response?.data?.message || err.response?.data?.error || err.message || "";
    
    if (!rawMessage) return fallback;

    // Detect patterns that suggest a technical/developer error
    // (e.g., specific API names, bracketed details, URLs, or generic system errors)
    const isTechnical = /\[|\]|http|google|generative|503|404|stack|trace|internal|network|failed to respond|unavailable/i.test(rawMessage);

    if (isTechnical) {
        return fallback;
    }

    return rawMessage;
}
