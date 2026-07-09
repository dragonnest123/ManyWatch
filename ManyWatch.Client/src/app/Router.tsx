import { createBrowserRouter } from 'react-router-dom';
import { CreateRoomPage } from '../pages/CreateRoomPage';
import { HomePage } from '../pages/HomePage';
import { JoinRoomPage } from '../pages/JoinRoomPage';
import { RoomPage } from '../pages/RoomPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
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
]);
