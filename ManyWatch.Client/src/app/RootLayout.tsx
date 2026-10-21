import { Outlet } from 'react-router-dom';
import { FriendsNotifications } from '../features/friends/components/FriendsNotifications';
import { CurrentRoomBar } from '../shared/CurrentRoomBar';
import { RoomPresenceHeartbeat } from '../shared/RoomPresenceHeartbeat';

export function RootLayout() {
  return (
    <>
      <Outlet />
      <CurrentRoomBar />
      <RoomPresenceHeartbeat />
      <FriendsNotifications />
    </>
  );
}
