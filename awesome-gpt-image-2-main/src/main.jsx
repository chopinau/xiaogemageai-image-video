import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { App } from './App';
import { NotificationProvider } from './contexts/NotificationContext';
import { AuthProvider } from './contexts/AuthContext';
import { CreditsProvider } from './contexts/CreditsContext';
import { MemberProvider } from './contexts/MemberContext';
import './styles.css';
import './styles/shared.css';
import './styles/creative-hub.css';
import './styles/user-dashboard.css';

createRoot(document.getElementById('root')).render(
  <HashRouter>
    <NotificationProvider>
      <AuthProvider>
        <CreditsProvider>
          <MemberProvider>
            <App />
          </MemberProvider>
        </CreditsProvider>
      </AuthProvider>
    </NotificationProvider>
  </HashRouter>
);
