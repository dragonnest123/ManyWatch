namespace ManyWatch.Domain;

public class DirectMessage
{
    public const int MaxContentLength = 500;

    public Guid Id { get; init; }
    public Guid SenderId { get; init; }
    public Guid RecipientId { get; init; }
    public string Content { get; private set; }
    public DateTime SentAt { get; init; }

    private DirectMessage()
    {
        Content = string.Empty;
    }

    public DirectMessage(Guid senderId, Guid recipientId, string content, DateTime? sentAt = null)
    {
        if (senderId == recipientId)
            throw new ArgumentException("A user cannot message themselves", nameof(recipientId));

        Id = Guid.CreateVersion7();
        SenderId = senderId;
        RecipientId = recipientId;
        Content = content;
        SentAt = sentAt ?? DateTime.UtcNow;
    }
}
