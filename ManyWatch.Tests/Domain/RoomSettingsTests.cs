using ManyWatch.Domain;

namespace ManyWatch.Tests.Domain;

public class RoomSettingsTests
{
    [Fact]
    public void Constructor_StoresValues()
    {
        var settings = new RoomSettings(isPrivate: true, maxMembers: 10, joinPolicy: RoomJoinPolicy.AuthorizedOnly);

        Assert.True(settings.IsPrivate);
        Assert.Equal(10, settings.MaxMembers);
        Assert.Equal(RoomJoinPolicy.AuthorizedOnly, settings.JoinPolicy);
    }

    [Fact]
    public void Update_ReplacesAllValues()
    {
        var settings = new RoomSettings(isPrivate: false, maxMembers: null, joinPolicy: RoomJoinPolicy.Everyone);

        settings.Update(isPrivate: true, maxMembers: 5, joinPolicy: RoomJoinPolicy.AuthorizedOnly);

        Assert.True(settings.IsPrivate);
        Assert.Equal(5, settings.MaxMembers);
        Assert.Equal(RoomJoinPolicy.AuthorizedOnly, settings.JoinPolicy);
    }
}
