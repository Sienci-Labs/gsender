// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
//

// Import commands.js using ES2015 syntax:
import "./commands";
import "cypress-real-events/support";
import "cypress-mochawesome-reporter/register";
import "cypress-grep";

// cypress/support/e2e.js
Cypress.on("uncaught:exception", (err) => {
    if (err.message.includes("addUpdateRange is not a function")) return false;

    if (err.message.includes('PostHog')) {
        return false;
    }

    // Ignore WebSocket connection error
    if (err.message.includes('WebSocket') ||
        err.message.includes('socket.io') ||
        err.message.includes('Network Error')) {
        return false;
    }

    // Ignore MaxListeners memory leak warning
    if (err.message.includes('MaxListenersExceeded') ||
        err.message.includes('memory leak')) {
        return false;
    }

    // Still fail on all other unexpected errors
    return true;
});

// Alternatively you can use CommonJS syntax:
// require('./commands')