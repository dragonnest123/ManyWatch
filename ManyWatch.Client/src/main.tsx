import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { AuthProvider } from './features/auth/context/AuthContext';
import { CurrentRoomProvider } from './features/rooms/context/CurrentRoomContext';
import '@fontsource-variable/fraunces/wght.css';
import '@fontsource-variable/fraunces/wght-italic.css';
import '@fontsource-variable/manrope/wght.css';
import './index.css';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <AuthProvider>
            <CurrentRoomProvider>
                <App />
            </CurrentRoomProvider>
        </AuthProvider>
    </StrictMode>,
);