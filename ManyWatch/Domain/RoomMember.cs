namespace ManyWatch.Domain;

public class RoomMember
{
    public Guid UserId { get; set; }
    public Guid RoomId { get; set; }
    public DateTime JoinedAt { get; set; }
    public bool IsHost { get; set; }
    
    public RoomMember(Guid userId, Guid roomId, bool isHost)
    {
        UserId = userId;
        RoomId = roomId;
        JoinedAt = DateTime.UtcNow;
        IsHost = isHost;
    }
}