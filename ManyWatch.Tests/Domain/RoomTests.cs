using ManyWatch.Domain;

namespace ManyWatch.Tests.Domain;

public class RoomTests
{
    private static readonly DateTime BaseTime = new(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);

    [Fact]
    public void Constructor_AppliesPublicDefaults()
    {
        var room = new Room(Guid.NewGuid(), "movie night", isPrivate: false);

        Assert.NotEqual(Guid.Empty, room.Id);
        Assert.Equal("movie night", room.Name);
        Assert.False(room.Settings.IsPrivate);
        Assert.Null(room.Settings.MaxMembers);
        Assert.Equal(RoomJoinPolicy.Everyone, room.Settings.JoinPolicy);
    }

    [Fact]
    public void RemoveMember_WhenHostLeaves_TransfersHostToOldestMember()
    {
        var hostId = Guid.NewGuid();
        var room = new Room(hostId, "room", isPrivate: false);
        var host = Member(hostId, isHost: true, joinedAt: BaseTime);
        var oldest = Member(Guid.NewGuid(), isHost: false, joinedAt: BaseTime.AddMinutes(1));
        var newest = Member(Guid.NewGuid(), isHost: false, joinedAt: BaseTime.AddMinutes(2));
        room.Members.AddRange([host, oldest, newest]);

        room.RemoveMember(host);

        Assert.DoesNotContain(host, room.Members);
        Assert.True(oldest.IsHost);
        Assert.False(newest.IsHost);
        Assert.Equal(oldest.UserId, room.HostId);
    }

    [Fact]
    public void RemoveMember_WhenRegularMemberLeaves_KeepsCurrentHost()
    {
        var hostId = Guid.NewGuid();
        var room = new Room(hostId, "room", isPrivate: false);
        var host = Member(hostId, isHost: true, joinedAt: BaseTime);
        var member = Member(Guid.NewGuid(), isHost: false, joinedAt: BaseTime.AddMinutes(1));
        room.Members.AddRange([host, member]);

        room.RemoveMember(member);

        Assert.DoesNotContain(member, room.Members);
        Assert.True(host.IsHost);
        Assert.Equal(hostId, room.HostId);
    }

    [Fact]
    public void RemoveMember_WhenLastMemberLeaves_LeavesRoomWithoutMembers()
    {
        var hostId = Guid.NewGuid();
        var room = new Room(hostId, "room", isPrivate: false);
        var host = Member(hostId, isHost: true, joinedAt: BaseTime);
        room.Members.Add(host);

        room.RemoveMember(host);

        Assert.Empty(room.Members);
        Assert.Equal(hostId, room.HostId);
    }

    [Fact]
    public void Rename_ChangesName()
    {
        var room = new Room(Guid.NewGuid(), "before", isPrivate: false);

        room.Rename("after");

        Assert.Equal("after", room.Name);
    }

    private static RoomMember Member(Guid userId, bool isHost, DateTime joinedAt)
    {
        return new RoomMember(userId, Guid.NewGuid(), isHost) { JoinedAt = joinedAt };
    }
}
