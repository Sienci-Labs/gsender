/**
 * @jest-environment jsdom
 */

/**
 * Specifically it checks:
 * Jest can run
 * jsdom environment is set up correctly
 * React can render a component
 * @testing-library/react is installed and working
 * The test pipeline itself is not broken
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

function Hello() {
  return <div>Hello World</div>;
}

test('renders hello world', () => {
  render(<Hello />);
  expect(screen.getByText('Hello World')).toBeInTheDocument();
});