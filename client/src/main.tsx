import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClerkProvider } from "@clerk/clerk-react";
import { dark } from "@clerk/themes";

const queryClient = new QueryClient();
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "";

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    {PUBLISHABLE_KEY ? (
      <ClerkProvider 
        publishableKey={PUBLISHABLE_KEY}
        afterSignOutUrl="/"
        appearance={{
          baseTheme: dark,
          variables: {
            colorPrimary: '#408A71',
            colorBackground: '#141414',
            colorInputBackground: '#0a0a0a',
            colorInputText: '#ffffff',
            colorText: '#ffffff',
            colorTextSecondary: '#9c9c9c',
            fontFamily: 'DM Sans, sans-serif',
            borderRadius: '10px',
          },
          elements: {
            card: 'clerk-card-custom',
            formButtonPrimary: 'clerk-btn-primary',
            socialButtonsBlockButton: 'clerk-social-btn',
            footerActionLink: 'clerk-link',
          }
        }}
      >
        <App />
      </ClerkProvider>
    ) : (
      <App />
    )}
  </QueryClientProvider>
);

