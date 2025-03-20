import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom'

test('renders a simple component', () => {
  render(<div>Hello, world!</div>);
  expect(screen.getByText('Hello, world!')).toBeInTheDocument();
});