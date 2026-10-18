namespace ManyWatch.Domain;

public class RoomMember
{
    public Guid UserId { get; init; }
    public Guid RoomId { get; init; }
    public Room? Room { get; init; }
    public DateTime JoinedAt { get; init; }
    public DateTime LastSeenAt { get; set; }
    public bool IsHost { get; set; }
    
    private RoomMember()
    {
    }

    public RoomMember(Guid userId, Guid roomId, bool isHost)
    {
        UserId = userId;
        RoomId = roomId;
        JoinedAt = DateTime.UtcNow;
        LastSeenAt = DateTime.UtcNow;
        IsHost = isHost;
    }
}