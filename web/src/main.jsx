import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { firebaseConfigurado } from './services/firebase';
import './styles.css';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  firebaseConfigurado ? (
    <React.StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </React.StrictMode>
  ) : (
    // Sin configuración se explica qué falta, en vez de mostrar una pantalla en blanco.
    <p className="centro">
      Falta la configuración de Firebase. Copie <code>web/.env.example</code> como <code>web/.env.local</code> y
      complete los valores.
    </p>
  ),
);
