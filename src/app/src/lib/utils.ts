import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatDate(input: string | number): string {
    const date = new Date(input);
    return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });
}

export function absoluteUrl(path: string) {
    //return `${process.env.NEXT_PUBLIC_APP_URL}${path}`;
    return '';
}

/**
 * Checks if a string is a valid IPv4 address format
 * @param str - The string to check
 * @returns true if the string is a valid IPv4 address format, false otherwise
 */
export function isV4Format(str: string): boolean {
    if (!str || typeof str !== 'string') {
        return false;
    }

    // IPv4 regex pattern: matches x.x.x.x where x is 0-255
    const ipv4Regex =
        /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

    return ipv4Regex.test(str.trim());
}
