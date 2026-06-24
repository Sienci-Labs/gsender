// Import commands.js using ES2015 syntax:
import "./commands";
import "cypress-real-events/support";
import "cypress-mochawesome-reporter/register";
import "cypress-grep";

Cypress.on("uncaught:exception", (err) => {
    if (err.message.includes("addUpdateRange is not a function")) return false;

    if (err.message.includes('PostHog')) return false;

    // Ignore WebSocket connection error
    if (err.message.includes('WebSocket') ||
        err.message.includes('socket.io') ||
        err.message.includes('Network Error')) return false;

    // Ignore MaxListeners memory leak warning
    if (err.message.includes('MaxListenersExceeded') ||
        err.message.includes('memory leak')) return false;

    // Suppress app-level scrollIntoView errors on unmounted elements
    if (err.message.includes("Cannot read properties of null (reading 'scrollIntoView')")) return false;

    // Ignore WebGL errors in test environment
    if (err.message.includes('displayWebGLErrorMessage')) return false;

    // Still fail on all other unexpected errors
    return true;
});