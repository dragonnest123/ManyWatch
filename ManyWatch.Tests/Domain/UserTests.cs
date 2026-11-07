using ManyWatch.Domain;

namespace ManyWatch.Tests.Domain;

public class UserTests
{
    [Fact]
    public void UpdateProfile_TrimsBioAndClearsBlankValues()
    {
        var user = new User("user@example.com", "viewer", "hash", "Old Name");

        user.UpdateProfile("New Name", "  About me  ");
        Assert.Equal("New Name", user.DisplayName);
        Assert.Equal("About me", user.Bio);

        user.UpdateProfile("New Name", "   ");
        Assert.Null(user.Bio);
    }

    [Fact]
    public void Username_IsNormalized()
    {
        var user = new User("user@example.com", "  Alice_01 ", "hash", "Viewer");

        Assert.Equal("alice_01", user.Username);

        user.UpdateUsername("Bob_02");
        Assert.Equal("bob_02", user.Username);
    }

    [Fact]
    public void AddWatchedSeconds_AccumulatesTotal()
    {
        var user = new User("user@example.com", "viewer", "hash", "Viewer");

        user.AddWatchedSeconds(120);
        user.AddWatchedSeconds(30);

        Assert.Equal(150, user.WatchedSeconds);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void AddWatchedSeconds_NonPositiveValue_Throws(long seconds)
    {
        var user = new User("user@example.com", "viewer", "hash", "Viewer");

        Assert.Throws<ArgumentOutOfRangeException>(() => user.AddWatchedSeconds(seconds));
    }
}
