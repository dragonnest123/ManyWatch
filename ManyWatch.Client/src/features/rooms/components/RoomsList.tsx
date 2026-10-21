import type { PagedResult, RoomListItem } from '../model/types';

type Props = {
  page: PagedResult<RoomListItem>;
  joiningRoomId: string | null;
  isRefreshing: boolean;
  onJoin: (room: RoomListItem) => void;
  onPageChange: (pageNumber: number) => void;
};

export function RoomsList({ page, joiningRoomId, isRefreshing, onJoin, onPageChange }: Props) {
  const { items, totalItemsCount, pageInfo } = page;
  const pageCount = Math.max(1, Math.ceil(totalItemsCount / pageInfo.pageSize));

  if (items.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-state-mark" aria-hidden="true">
          ◌
        </span>
        <h2>Nothing on screen yet</h2>
        <p className="muted">No rooms match your filters. Try a different search or create a room</p>
      </div>
    );
  }

  return (
    <>
      <ul className={`rooms-grid${isRefreshing ? ' refreshing' : ''}`}>
        {items.map((room) => {
          const isFull = room.maxMembers !== null && room.memberCount >= room.maxMembers;

          return (
            <li className="card room-item" key={room.id}>
              <div className="room-item-top">
                <div className="room-poster" aria-hidden="true">
                  <span className="room-poster-letter">{getInitial(room.name)}</span>
                  <span className="room-poster-label">
                    {room.isPrivate ? 'Private screening' : 'Open screening'}
                  </span>
                </div>

                <div className="room-item-info">
                  <p className="eyebrow">{room.isPrivate ? 'Private' : 'Public'}</p>
                  <h3>{room.name}</h3>
                  <p className="muted">
                    {room.maxMembers !== null
                      ? `${room.memberCount} / ${room.maxMembers} seats taken`
                      : `${room.memberCount} ${room.memberCount === 1 ? 'viewer' : 'viewers'} inside`}
                  </p>
                  {room.joinPolicy === 'AuthorizedOnly' && (
                    <p className="room-note">Signed-in users only</p>
                  )}
                </div>
              </div>

              <div className="room-item-footer">
                <span className={`room-seats${isFull ? ' is-full' : ''}`}>
                  <span className="seat-dot" aria-hidden="true" />
                  {isFull ? 'Room full' : 'Seats available'}
                </span>

                {room.isPrivate ? (
                  <button
                    className="secondary compact"
                    disabled
                    title="Private rooms can be joined only through their link"
                  >
                    Invite only
                  </button>
                ) : (
                  <button
                    className="compact"
                    disabled={joiningRoomId === room.id || isFull}
                    title={isFull ? 'The room is full' : undefined}
                    onClick={() => onJoin(room)}
                  >
                    {isFull ? 'Full' : joiningRoomId === room.id ? 'Joining...' : 'Join room'}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="pagination">
        <button
          className="secondary compact"
          disabled={isRefreshing || pageInfo.pageNumber <= 1}
          onClick={() => onPageChange(pageInfo.pageNumber - 1)}
        >
          ← Prev
        </button>

        <span className="muted pagination-label">
          Page {pageInfo.pageNumber} of {pageCount} · {totalItemsCount}{' '}
          {totalItemsCount === 1 ? 'room' : 'rooms'}
        </span>

        <button
          className="secondary compact"
          disabled={isRefreshing || pageInfo.pageNumber >= pageCount}
          onClick={() => onPageChange(pageInfo.pageNumber + 1)}
        >
          Next →
        </button>
      </div>
    </>
  );
}

function getInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?';
}
