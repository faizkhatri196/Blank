import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LocationProvider } from './contexts/LocationContext';
import { PwaInstallProvider } from './contexts/PwaInstallContext';
import { AppRoutes } from './routes';
import { InstallAppPrompt } from './components/common/InstallAppPrompt';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LocationProvider>
          <PwaInstallProvider>
            <AppRoutes />
            <InstallAppPrompt />
          </PwaInstallProvider>
        </LocationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
