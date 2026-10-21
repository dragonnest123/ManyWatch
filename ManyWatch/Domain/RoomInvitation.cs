namespace ManyWatch.Domain;

public class RoomInvitation
{
    public Guid Id { get; init; }
    public Guid RoomId { get; init; }
    public Room? Room { get; init; }
    public Guid SenderId { get; init; }
    public User? Sender { get; init; }
    public Guid RecipientId { get; init; }
    public DateTime CreatedAt { get; init; }

    private RoomInvitation()
    {
    }

    public RoomInvitation(Guid roomId, Guid senderId, Guid recipientId)
    {
        if (senderId == recipientId)
            throw new ArgumentException("A user cannot invite themselves", nameof(recipientId));

        Id = Guid.CreateVersion7();
        RoomId = roomId;
        SenderId = senderId;
        RecipientId = recipientId;
        CreatedAt = DateTime.UtcNow;
    }
}
