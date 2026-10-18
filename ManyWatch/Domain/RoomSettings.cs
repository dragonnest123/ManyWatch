namespace ManyWatch.Domain;

public class RoomSettings
{
    public bool IsPrivate { get; private set; }
    public int? MaxMembers { get; private set; }
    public RoomJoinPolicy JoinPolicy { get; private set; }

    private RoomSettings()
    {
    }

    public RoomSettings(bool isPrivate, int? maxMembers, RoomJoinPolicy joinPolicy)
    {
        Update(isPrivate, maxMembers, joinPolicy);
    }

    public void Update(bool isPrivate, int? maxMembers, RoomJoinPolicy joinPolicy)
    {
        IsPrivate = isPrivate;
        MaxMembers = maxMembers;
        JoinPolicy = joinPolicy;
    }
}
