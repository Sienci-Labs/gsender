# Testing Overview

gSender uses two primary testing tools:

| Tool    | Purpose                  | Runs in CI |
| ------- | ------------------------ | ---------- |
| Jest    | Frontend unit testing    | Yes        |
| Cypress | End-to-End (E2E) testing | Yes        |# Using Cypress

## Important Notes
### Connection Issues
- sometimes the hover will not work. if you notice the test waiting for something and then failing when trying to connect, it's most likely the hover glitching.
- if this happens, hover over the connection bar yourself or retry the test until it works
- i am not sure what causes this glitch, whether it is our issue or the function's

## Setup
### Environment Variables
- example values located in `.cypress.env.json`
- vars:
    - `grbl_port` => port of your grbl machine, used for connecting
    - `grblhal_port` => port of your grblhal machine, used for connecting
    - `file` => path to the file you want to use
    - `X+Y+/X-Y-/X+Y-/X-Y+` => keys for shortcuts, in the form `{key}` (ex. `{alt}{leftArrow}`)
### Running Cypress
- start your server
- set up your environment variables outlined in `.cypress.env.json`
- `npm run cypress:open`
- choose E2E
- choose your browser
- click on a test file to start running!

## Development
### API:
**https://docs.cypress.io/api/table-of-contents**
- most common functions:
    - - `cy.visit` => visit a webpage. If no URL is specified, uses `baseUrl` in `cypress.config.js`
    - `cy.get` => find an element by id or class
    - `cy.contains` => find an element by the value it contains (ex. `cy.contains('Save')` to get a button with the text 'Save')
    - `cy.should` => make an assertion
    - `cy.wait` => wait for a certain number of milliseconds
- you can find by class by using `.`, and by id by using `#` (ex. `cy.get('#myid')` or `cy.get('.myclass')`)# Frontend Testing Guide

This document explains how to run **frontend unit tests locally** for the **gSender** project.
 Unit test and end-to-end tests are automated 

# Quick Command  Overview

| Command | Description |
|-------|-------------|
| `npx cypress open` | Launch the Cypress Test Runner UI to run tests interactively |
| `npm run report:clean && (npx cypress run --spec <test_file> || true) && npm run report:merge && npm run report:generate && npm run dashboard:generate && npm run dashboard:open` | Run a specific Cypress test file and generate the full dashboard report |
| `npm run dashboard:generate && npm run dashboard:open` | Generate and open the combined Cypress dashboard report |
| `node cypress/dashboard/generate-dashboard.js` | Generate the dashboard report only |
| `(cygpath -w cypress/dashboard/report/index.html)` | Open the Cypress dashboard report explorer |
| `npm run report:clean && npx cypress run --spec <test_file> && npm run report:merge && npm run report:generate` | Run a specific Cypress test file and generate a Mochawesome report |
| `start cypress/reports/mochawesome/index.html` | Open the generated Mochawesome Cypress test report |

 

# Prerequisites

Before running tests, ensure project dependencies are installed:

```bash
yarn install
```

# Running Unit Tests (Jest)

## From the Repository Root

```bash
yarn test:app
```

## From the `src/app` Directory

```bash
cd src/app
yarn test
```

Both commands run the same Jest test suite.
Use whichever fits your workflow.

# Watch Mode

Watch mode automatically re-runs tests whenever a file changes.
This is helpful when actively writing or debugging tests.

## From the repository root

```bash
yarn test:app --watch
```

## From `src/app`

```bash
cd src/app
yarn test --watch
```

### Useful Watch Mode Shortcuts

| Key | Action                    |
| --- | ------------------------- |
| `a` | Run all tests             |
| `p` | Filter tests by filename  |
| `t` | Filter tests by test name |
| `q` | Quit watch mode           |


# Running a Specific Test File

```bash
yarn test:app --testPathPattern=App.test.tsx
```

# Running Tests with Verbose Output

(Provides more detailed output during test execution)

```bash
yarn test:app --verbose
```
# Running Tests with Coverage Report

```bash
yarn test:app --coverage
```
This generates a report showing how much of the codebase is covered by tests.

| Coverage  | Rating     |
| --------- | ---------- |
| Below 60% | Poor       |
| 60% – 80% | Acceptable |
| 80% – 90% | Good       |
| 90%+      | Excellent  |

# Test Directory Structure

```
src/app/src/
├── tests/
│   ├── App.test.tsx
│   └── smoke.test.jsx
├── components/
│   └── Button/
│       └── Button.test.tsx
```

### Description

* **App.test.tsx** – Tests the main application entry point.
* **smoke.test.jsx** – Basic environment validation.
* **Button.test.tsx** – Unit tests for the Button component.

# Quick Command Reference

| Command                                  | Description                              |
| ---------------------------------------- | ---------------------------------------- |
| `yarn test:app`                          | Run all unit tests once (repo root)      |
| `yarn test`                              | Run all unit tests once (from `src/app`) |
| `yarn test:app --watch`                  | Run tests in watch mode (repo root)      |
| `yarn test --watch`                      | Run tests in watch mode (from `src/app`) |
| `yarn test:app --verbose`                | Display detailed test output             |
| `yarn test:app --coverage`               | Generate a coverage report               |
| `yarn test:app --testPathPattern=<file>` | Run a specific test file                 |

# CI Behavior

On every **push** or **pull request**, the CI pipeline automatically runs both **Jest** and **Cypress** tests.

* If any **Jest unit test fails**, the CI job fails and the pull request cannot be merged.
* If any **Cypress E2E test fails**, the CI job fails and the pull request cannot be merged.
* Tests do **not need to be manually triggered**; CI handles this automatically.
