namespace ManyWatch.Features.Friends;

public sealed class FriendsPresenceTracker
{
    private readonly Lock _gate = new();
    private readonly Dictionary<Guid, int> _connectionCounts = new();

    public bool AddConnection(Guid userId)
    {
        lock (_gate)
        {
            _connectionCounts.TryGetValue(userId, out var count);
            _connectionCounts[userId] = count + 1;

            return count == 0;
        }
    }

    public bool RemoveConnection(Guid userId)
    {
        lock (_gate)
        {
            if (!_connectionCounts.TryGetValue(userId, out var count))
                return false;

            if (count > 1)
            {
                _connectionCounts[userId] = count - 1;
                return false;
            }

            _connectionCounts.Remove(userId);
            return true;
        }
    }

    public bool IsOnline(Guid userId)
    {
        lock (_gate)
        {
            return _connectionCounts.ContainsKey(userId);
        }
    }
}
