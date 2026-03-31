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
