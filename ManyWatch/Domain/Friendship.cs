namespace ManyWatch.Domain;

public enum FriendshipStatus
{
    Pending,
    Accepted
}

public class Friendship
{
    public Guid Id { get; init; }
    public Guid UserLowId { get; init; }
    public Guid UserHighId { get; init; }
    public Guid RequestedById { get; init; }
    public FriendshipStatus Status { get; private set; }
    public DateTime CreatedAt { get; init; }
    public DateTime? RespondedAt { get; private set; }

    private Friendship()
    {
    }

    public Friendship(Guid requesterId, Guid addresseeId)
    {
        if (requesterId == addresseeId)
            throw new ArgumentException("A user cannot be friends with themselves", nameof(addresseeId));

        var (lowId, highId) = Order(requesterId, addresseeId);

        Id = Guid.CreateVersion7();
        UserLowId = lowId;
        UserHighId = highId;
        RequestedById = requesterId;
        Status = FriendshipStatus.Pending;
        CreatedAt = DateTime.UtcNow;
    }

    public bool IsParticipant(Guid userId)
    {
        return userId == UserLowId || userId == UserHighId;
    }

    public Guid OtherUserId(Guid userId)
    {
        if (userId == UserLowId)
            return UserHighId;

        if (userId == UserHighId)
            return UserLowId;

        throw new InvalidOperationException("The user is not a participant of this friendship");
    }

    public bool CanAccept(Guid userId)
    {
        return Status == FriendshipStatus.Pending
               && IsParticipant(userId)
               && RequestedById != userId;
    }

    public void Accept(Guid userId)
    {
        if (!CanAccept(userId))
            throw new InvalidOperationException("Only the addressee of a pending request can accept it");

        Status = FriendshipStatus.Accepted;
        RespondedAt = DateTime.UtcNow;
    }

    public static (Guid LowId, Guid HighId) Order(Guid firstUserId, Guid secondUserId)
    {
        return firstUserId.CompareTo(secondUserId) <= 0
            ? (firstUserId, secondUserId)
            : (secondUserId, firstUserId);
    }
}
