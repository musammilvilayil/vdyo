import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { ClerkProvider } from '@clerk/react';
import './styles.css';

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {publishableKey ? <ClerkProvider publishableKey={publishableKey}><App /></ClerkProvider> : <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0b0e14', color: '#e8eaf0', fontFamily: 'system-ui', padding: 24 }}><section style={{ maxWidth: 520 }}><h1>VDYO setup required</h1><p>Add VITE_CLERK_PUBLISHABLE_KEY to the web environment and CLERK_SECRET_KEY + CLERK_PUBLISHABLE_KEY to the API environment to enable secure sign-in.</p></section></main>}
  </React.StrictMode>
);
