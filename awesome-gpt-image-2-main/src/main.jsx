import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { App } from './App';
import { AuthProvider } from './contexts/AuthContext';
import { MemberProvider } from './contexts/MemberContext';
import { CreditsProvider } from './contexts/CreditsContext';
import { NotificationProvider } from './contexts/NotificationContext';
import './styles.css';
import './styles/shared.css';

createRoot(document.getElementById('root')).render(
  <HashRouter>
    <NotificationProvider>
      <AuthProvider>
        <MemberProvider>
          <CreditsProvider>
            <App />
          </CreditsProvider>
        </MemberProvider>
      </AuthProvider>
    </NotificationProvider>
  </HashRouter>
);
