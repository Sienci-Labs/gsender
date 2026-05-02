import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from 'app/components/Button';

describe('Button component', () => {
  test('renders with text prop', () => {
    render(<Button text="Click me" />);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  test('renders children', () => {
    render(<Button>Hello</Button>);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  test('is disabled when disabled prop is true', () => {
    render(<Button text="Disabled" disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  test('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button text="Click" onClick={handleClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
