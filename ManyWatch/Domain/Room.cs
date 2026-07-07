namespace ManyWatch.Domain;

public class Room
{
    public Guid Id { get; set; }
    public Guid HostId { get; set; }
    public string Code { get; set; }
    public string Name { get; set; }
    public bool IsPrivate { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<RoomMember> Members { get; set; }

    public Room(Guid hostId, string name, string code, bool isPrivate)
    {
        Id = Guid.CreateVersion7();
        HostId = hostId;
        Code = code;
        Name = name;
        IsPrivate = isPrivate;
        CreatedAt = DateTime.UtcNow;
        Members = [];
    }
}