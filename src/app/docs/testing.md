# Frontend Unit Testing

This document is the in-repo quick reference for frontend unit tests in `gSender`.
Use it for day-to-day work; keep it short and aligned with the current codebase.

## Scope

- Frontend unit/component tests run with `jest` + `@testing-library/react`.
- Existing config is defined at:
  - `jest.config.js`
  - `jest.setup.js`
  - `src/app/jest.setup.cjs`

## Run Tests

From the repository root:

- Run all unit tests once:
  - `npm run test:unit`
- Run in watch mode:
  - `npm run test:unit:watch`
- Run a single test file:
  - `npx jest __tests__/Button.test.tsx`

## Test Location and Naming

- Put tests in either:
  - `__tests__/...`
  - `*.test.tsx` or `*.test.ts`
- Keep tests close to their feature when practical, or use `__tests__` for shared/component-level tests.
- Prefer one test file per component/hook/module under test.

## Current Conventions

- Prefer React Testing Library queries (`getByRole`, `getByText`, etc.) over implementation details.
- Test behavior, not internal state.
- Keep tests deterministic and isolated (no shared mutable state across tests).
- Mock external dependencies that are not part of the unit being tested.

## Helpers and Environment Notes

- `@testing-library/jest-dom` is enabled globally via setup files.
- `TextEncoder` and `TextDecoder` are polyfilled in `jest.setup.js`.
- Asset/style imports are mapped through Jest module mappers.
- `app/*` import aliases are supported in tests via `moduleNameMapper`.

## Mocking Guidance

- Mock app-level modules when needed with `jest.mock(...)`.
- For complex mocks, prefer dedicated mock files near the test or inside `__mocks__/`.
- Keep mocks minimal: only mock behavior required by the test case.

## What to Cover in New Tests

- Rendering for primary and edge states.
- User interactions (click, type, keyboard where relevant).
- Conditional UI logic and disabled/error states.
- Callback/dispatch side effects at component boundaries.

## Examples

Use these as starting templates and adapt naming/paths to your feature.

### 1) Component render + interaction

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from 'app/components/Button';

test('calls onClick when pressed', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();

    render(<Button onClick={onClick}>Run</Button>);
    await user.click(screen.getByRole('button', { name: /run/i }));

    expect(onClick).toHaveBeenCalledTimes(1);
});
```

### 2) Hook test with a mocked dependency

```ts
import { renderHook } from '@testing-library/react';
import useGetDataCollectionStatus from 'app/hooks/useGetDataCollectionStatus';
import useTypedSelector from 'app/hooks/useTypedSelector';

jest.mock('app/hooks/useTypedSelector', () => ({
    __esModule: true,
    default: jest.fn(),
}));

test('returns data collection status from store', () => {
    (useTypedSelector as jest.Mock).mockImplementation((selectorFn) =>
        selectorFn({ settings: { dataCollection: { enabled: true } } }),
    );

    const { result } = renderHook(() => useGetDataCollectionStatus());
    expect(result.current).toBe(true);
});
```

### 3) Module mock pattern for app services

```ts
import { myAction } from 'app/store/actions/myAction';
import api from 'app/lib/api';

jest.mock('app/lib/api', () => ({
    __esModule: true,
    default: {
        post: jest.fn(),
    },
}));

test('calls api with expected payload', async () => {
    (api.post as jest.Mock).mockResolvedValue({ ok: true });

    await myAction({ id: 'abc' });
    expect(api.post).toHaveBeenCalledWith('/endpoint', { id: 'abc' });
});
```

## Extended Reference

For the full workflow and deeper rationale, see:

- [gSender Frontend Unit Testing Workflow (Notion)](https://www.notion.so/walids-space/gSender-Frontend-Unit-Testing-Workflow-Full-Guide-314b85710878803ca066cc444b9a502b?source=copy_link)
