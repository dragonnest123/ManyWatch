import { Outlet } from 'react-router-dom';
import { CurrentRoomBar } from '../shared/CurrentRoomBar';
import { RoomPresenceHeartbeat } from '../shared/RoomPresenceHeartbeat';

export function RootLayout() {
  return (
    <>
      <Outlet />
      <CurrentRoomBar />
      <RoomPresenceHeartbeat />
    </>
  );
}
