import { createBrowserRouter } from 'react-router-dom';
import { CreateRoomPage } from '../pages/CreateRoomPage';
import { FriendsPage } from '../pages/FriendsPage';
import { HelpPage } from '../pages/HelpPage';
import { HomePage } from '../pages/HomePage';
import { JoinRoomPage } from '../pages/JoinRoomPage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { RoomPage } from '../pages/RoomPage';
import { RoomsListPage } from '../pages/RoomsListPage';
import { RootLayout } from './RootLayout';

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: '/',
        element: <HomePage />,
      },
      {
        path: '/rooms',
        element: <RoomsListPage />,
      },
      {
        path: '/rooms/create',
        element: <CreateRoomPage />,
      },
      {
        path: '/rooms/join',
        element: <JoinRoomPage />,
      },
      {
        path: '/rooms/:roomId',
        element: <RoomPage />,
      },
      {
        path: '/friends',
        element: <FriendsPage />,
      },
      {
        path: '/help',
        element: <HelpPage />,
      },
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        path: '/register',
        element: <RegisterPage />,
      },
    ],
  },
]);
