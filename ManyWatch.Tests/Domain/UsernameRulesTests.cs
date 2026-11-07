using ManyWatch.Domain;

namespace ManyWatch.Tests.Domain;

public class UsernameRulesTests
{
    [Theory]
    [InlineData("alice")]
    [InlineData("a_b")]
    [InlineData("user123")]
    [InlineData("abc")]
    [InlineData("abcdefghijklmnopqrstuvwxyz123456")]
    public void IsValid_AcceptsSupportedUsernames(string username)
    {
        Assert.True(UsernameRules.IsValid(username));
    }

    [Theory]
    [InlineData("")]
    [InlineData("ab")]
    [InlineData("1alice")]
    [InlineData("_alice")]
    [InlineData("alice!")]
    [InlineData("alice b")]
    [InlineData("abcdefghijklmnopqrstuvwxyz1234567")]
    public void IsValid_RejectsUnsupportedUsernames(string username)
    {
        Assert.False(UsernameRules.IsValid(username));
    }

    [Fact]
    public void Normalize_TrimsAndLowercases()
    {
        Assert.Equal("alice_01", UsernameRules.Normalize("  Alice_01  "));
    }
}
