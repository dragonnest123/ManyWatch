import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getRooms, joinRoom } from '../features/rooms/api/roomsApi';
import { RoomsFilterBar } from '../features/rooms/components/RoomsFilterBar';
import { RoomsList } from '../features/rooms/components/RoomsList';
import type { PagedResult, RoomListItem, RoomsFilter } from '../features/rooms/model/types';
import { AppHeader } from '../shared/AppHeader';
import { getCurrentUserId } from '../shared/currentUser';

const PAGE_SIZE = 8;

export function RoomsListPage() {
  const navigate = useNavigate();

  const [filter, setFilter] = useState<RoomsFilter>({});
  const [pageNumber, setPageNumber] = useState(1);
  const [page, setPage] = useState<PagedResult<RoomListItem> | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [joiningRoomId, setJoiningRoomId] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadRooms() {
      setError('');
      setIsLoading(true);

      try {
        const result = await getRooms(filter, { pageNumber, pageSize: PAGE_SIZE });
        if (!isCancelled) {
          setPage(result);
        }
      } catch (error) {
        if (!isCancelled) {
          setError(error instanceof Error ? error.message : 'Failed to load rooms');
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadRooms();

    return () => {
      isCancelled = true;
    };
  }, [filter, pageNumber]);

  function handleApplyFilter(nextFilter: RoomsFilter) {
    setFilter(nextFilter);
    setPageNumber(1);
  }

  async function handleJoin(room: RoomListItem) {
    setError('');
    setJoiningRoomId(room.id);

    try {
      const currentUserId = getCurrentUserId();
      await joinRoom(room.id, currentUserId);
      navigate(`/rooms/${room.id}?userId=${currentUserId}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to join room');
      setJoiningRoomId(null);
    }
  }

  return (
    <>
      <AppHeader />

      <main className="page rooms-list-page">
        <div className="rooms-toolbar">
          <Link className="back-link" to="/">
            ← Back
          </Link>

          <RoomsFilterBar filter={filter} onApply={handleApplyFilter} />
        </div>

        {error && <p className="error">{error}</p>}

        {!page && isLoading && <p>Loading...</p>}

        {page && (
          <RoomsList
            page={page}
            joiningRoomId={joiningRoomId}
            isRefreshing={isLoading}
            onJoin={handleJoin}
            onPageChange={setPageNumber}
          />
        )}
      </main>
    </>
  );
}
