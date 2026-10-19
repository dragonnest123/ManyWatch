namespace ManyWatch.Domain;

public class ChatMessage
{
    public const int MaxContentLength = 500;

    public Guid Id { get; init; }
    public Guid RoomId { get; init; }
    public Room? Room { get; init; }
    public Guid UserId { get; init; }
    public string Content { get; private set; }
    public DateTime SentAt { get; init; }

    private ChatMessage()
    {
        Content = string.Empty;
    }

    public ChatMessage(Guid roomId, Guid userId, string content, DateTime? sentAt = null)
    {
        Id = Guid.CreateVersion7();
        RoomId = roomId;
        UserId = userId;
        Content = content;
        SentAt = sentAt ?? DateTime.UtcNow;
    }
}
