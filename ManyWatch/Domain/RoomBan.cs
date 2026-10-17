namespace ManyWatch.Domain;

public class RoomBan
{
    public Guid RoomId { get; init; }
    public Guid UserId { get; init; }
    public Room? Room { get; init; }
    public DateTime BannedAt { get; init; }

    private RoomBan()
    {
    }

    public RoomBan(Guid roomId, Guid userId)
    {
        RoomId = roomId;
        UserId = userId;
        BannedAt = DateTime.UtcNow;
    }
}
