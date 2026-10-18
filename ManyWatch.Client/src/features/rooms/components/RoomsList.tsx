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
    return <p className="muted">No rooms match your filters.</p>;
  }

  return (
    <>
      <ul className={`rooms-grid${isRefreshing ? ' refreshing' : ''}`}>
        {items.map((room) => (
          <li className="card room-item" key={room.id}>
            <div>
              <p className="eyebrow">{room.isPrivate ? 'Private' : 'Public'}</p>
              <h3>{room.name}</h3>
              <p className="muted">
                {room.memberCount} {room.memberCount === 1 ? 'member' : 'members'}
              </p>
            </div>

            {room.isPrivate ? (
              <button
                className="secondary"
                disabled
                title="Private rooms can be joined only through their link."
              >
                Private
              </button>
            ) : (
              <button
                disabled={joiningRoomId === room.id}
                onClick={() => onJoin(room)}
              >
                {joiningRoomId === room.id ? 'Joining...' : 'Join'}
              </button>
            )}
          </li>
        ))}
      </ul>

      <div className="pagination">
        <button
          className="secondary"
          disabled={isRefreshing || pageInfo.pageNumber <= 1}
          onClick={() => onPageChange(pageInfo.pageNumber - 1)}
        >
          ← Prev
        </button>

        <span className="muted">
          Page {pageInfo.pageNumber} of {pageCount} · {totalItemsCount}{' '}
          {totalItemsCount === 1 ? 'room' : 'rooms'}
        </span>

        <button
          className="secondary"
          disabled={isRefreshing || pageInfo.pageNumber >= pageCount}
          onClick={() => onPageChange(pageInfo.pageNumber + 1)}
        >
          Next →
        </button>
      </div>
    </>
  );
}
