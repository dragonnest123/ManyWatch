namespace ManyWatch.Domain;

public class Room
{
    public Guid Id { get; init; }
    public Guid HostId { get; set; }
    public string Name { get; private set; }
    public RoomSettings Settings { get; private set; }
    public DateTime CreatedAt { get; init; }
    public List<RoomMember> Members { get; set; } = [];
    public List<RoomBan> Bans { get; set; } = [];
    public RoomPlayback? Playback { get; set; }

    private Room()
    {
        Name = string.Empty;
        Settings = new RoomSettings(isPrivate: false, maxMembers: null, joinPolicy: RoomJoinPolicy.Everyone);
    }

    public Room(
        Guid hostId,
        string name,
        bool isPrivate,
        int? maxMembers = null,
        RoomJoinPolicy joinPolicy = RoomJoinPolicy.Everyone)
    {
        Id = Guid.CreateVersion7();
        HostId = hostId;
        Name = name;
        Settings = new RoomSettings(isPrivate, maxMembers, joinPolicy);
        CreatedAt = DateTime.UtcNow;
    }

    public void Rename(string name)
    {
        Name = name;
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
