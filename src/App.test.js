import { render, screen } from '@testing-library/react';
import App from './App';

test('muestra el logo', () => {
  render(<App />);
  // Cambia el alt por el valor real de tu <img>
  const logo = screen.getByAltText(/logo/i);
  expect(logo).toBeInTheDocument();
});
