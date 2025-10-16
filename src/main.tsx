import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";

// Registrar o Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registrado com sucesso:', registration);
      })
      .catch(registrationError => {
        console.log('Falha no registro do Service Worker:', registrationError);
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);