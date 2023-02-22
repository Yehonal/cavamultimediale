import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders HyperWeb2', () => {
  render(<App />);
  const linkElement = screen.getByText(/HyperWeb2/i);
  expect(linkElement).toBeInTheDocument();
});
