namespace ManyWatch.Domain;

public class Room
{
    public Guid Id { get; set; }
    public Guid HostId { get; set; }
    public string Name { get; set; }
    public bool IsPrivate { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<RoomMember> Members { get; set; } = [];
    
    private Room()
    {
    }

    public Room(Guid hostId, string name, bool isPrivate)
    {
        Id = Guid.CreateVersion7();
        HostId = hostId;
        Name = name;
        IsPrivate = isPrivate;
        CreatedAt = DateTime.UtcNow;
    }
}