namespace ManyWatch.Domain;

public class UserAvatar
{
    public Guid UserId { get; set; }
    public byte[] Data { get; set; } = [];
    public string ContentType { get; set; } = string.Empty;
    public DateTime UpdatedAt { get; set; }

    private UserAvatar()
    {
    }

    public UserAvatar(Guid userId, byte[] data, string contentType, DateTime updatedAt)
    {
        UserId = userId;
        Data = data;
        ContentType = contentType;
        UpdatedAt = updatedAt;
    }

    public void Update(byte[] data, string contentType, DateTime updatedAt)
    {
        Data = data;
        ContentType = contentType;
        UpdatedAt = updatedAt;
    }
}
