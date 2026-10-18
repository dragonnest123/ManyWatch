namespace ManyWatch.Domain;

public class Room
{
    public Guid Id { get; init; }
    public Guid HostId { get; set; }
    public string Name { get; init; }
    public bool IsPrivate { get; init; }
    public DateTime CreatedAt { get; init; }
    public List<RoomMember> Members { get; set; } = [];
    public List<RoomBan> Bans { get; set; } = [];
    public RoomPlayback? Playback { get; set; }
    
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
    
    public void RemoveMember(RoomMember member)
    {
        Members.Remove(member);

        if (!member.IsHost)
            return;

        var nextHost = Members.MinBy(x => x.JoinedAt);
        if (nextHost is null)
            return;

        nextHost.IsHost = true;
        HostId = nextHost.UserId;
    }
}