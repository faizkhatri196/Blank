import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LocationProvider } from './contexts/LocationContext';
import { AppRoutes } from './routes';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LocationProvider>
          <AppRoutes />
        </LocationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
