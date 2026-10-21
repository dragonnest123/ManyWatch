import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getRooms, joinRoom } from '../features/rooms/api/roomsApi';
import { LeaveCurrentRoomDialog } from '../features/rooms/components/LeaveCurrentRoomDialog';
import { RoomsFilterBar } from '../features/rooms/components/RoomsFilterBar';
import { RoomsList } from '../features/rooms/components/RoomsList';
import { useRoomAction } from '../features/rooms/hooks/useRoomAction';
import type { PagedResult, RoomListItem, RoomsFilter } from '../features/rooms/model/types';
import { AppHeader } from '../shared/AppHeader';

const PAGE_SIZE = 8;

export function RoomsListPage() {
  const [filter, setFilter] = useState<RoomsFilter>({});
  const [pageNumber, setPageNumber] = useState(1);
  const [page, setPage] = useState<PagedResult<RoomListItem> | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const {
    pendingTarget,
    submittingTarget,
    currentRoomName,
    isSubmitting,
    error: joinError,
    requestAction,
    confirmAction,
    cancelAction,
  } = useRoomAction<{ id: string; name?: string }>({
    execute: (target) => joinRoom(target.id),
    errorMessage: 'Failed to join room',
    targetRoomId: (target) => target.id,
  });

  const joiningRoomId = submittingTarget?.id ?? null;

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

  function handleJoin(room: RoomListItem) {
    void requestAction({ id: room.id, name: room.name });
  }

  const displayedError = error || (pendingTarget ? '' : joinError);

  return (
    <>
      <AppHeader />

      <main className="page rooms-list-page">
        <header className="page-heading">
          <div>
            <h1>Rooms</h1>
            <p className="page-subtitle">Browse open rooms or create your own</p>
          </div>

          <div className="heading-actions">
            <RoomsFilterBar filter={filter} onApply={handleApplyFilter} />
            <Link className="button" to="/rooms/create">
              Create a room
            </Link>
          </div>
        </header>

        {displayedError && <p className="error">{displayedError}</p>}

        {!page && isLoading && <p className="muted loading-copy">Loading...</p>}

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

      {pendingTarget && (
        <LeaveCurrentRoomDialog
          description={
            <>
              You are already in <strong>{currentRoomName}</strong>. Do you want to leave it and
              join{' '}
              {pendingTarget.name ? <strong>{pendingTarget.name}</strong> : 'the new room'}?
            </>
          }
          confirmLabel="Leave and join"
          isSubmitting={isSubmitting}
          error={joinError}
          onConfirm={() => void confirmAction()}
          onCancel={cancelAction}
        />
      )}
    </>
  );
}