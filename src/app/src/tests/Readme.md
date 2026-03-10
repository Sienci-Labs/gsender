# Frontend Testing Guide

This document explains how to run **frontend unit tests locally** for the **gSender** project.
 Unit test and end-to-end tests are automated 

# Testing Overview

gSender uses two primary testing tools:

| Tool    | Purpose                  | Runs in CI |
| ------- | ------------------------ | ---------- |
| Jest    | Frontend unit testing    | Yes        |
| Cypress | End-to-End (E2E) testing | Yes        |



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
