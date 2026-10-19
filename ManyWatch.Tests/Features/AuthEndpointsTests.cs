using System.Net;
using ManyWatch.Tests.Helpers;

namespace ManyWatch.Tests.Features;

public class AuthEndpointsTests : IClassFixture<ManyWatchAppFactory>
{
    private readonly ManyWatchAppFactory _factory;

    public AuthEndpointsTests(ManyWatchAppFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task RegisterThenMe_ReturnsProfile()
    {
        var session = new TestSession(_factory);
        var email = $"user-{Guid.NewGuid():N}@example.com";

        var auth = await RegisterAsync(session, email);
        var me = await session.SendJsonAsync<MeDto>(HttpMethod.Get, "/auth/me", bearerToken: auth.AccessToken);

        Assert.Equal(auth.UserId, me.UserId);
        Assert.Equal(email, me.Email);
        Assert.Equal("Test User", me.DisplayName);
    }

    [Fact]
    public async Task Register_DuplicateEmail_ReturnsConflict()
    {
        var session = new TestSession(_factory);
        var email = $"duplicate-{Guid.NewGuid():N}@example.com";
        await RegisterAsync(session, email);

        var response = await session.SendAsync(HttpMethod.Post, "/auth/register", new
        {
            email,
            password = "password123",
            displayName = "Test User",
        });

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task Login_WrongPassword_ReturnsUnauthorized()
    {
        var session = new TestSession(_factory);
        var email = $"login-{Guid.NewGuid():N}@example.com";
        await RegisterAsync(session, email);

        var response = await session.SendAsync(HttpMethod.Post, "/auth/login", new
        {
            email,
            password = "wrong-password",
        });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Login_CorrectPassword_ReturnsTokens()
    {
        var session = new TestSession(_factory);
        var email = $"loginok-{Guid.NewGuid():N}@example.com";
        await RegisterAsync(session, email);

        var auth = await session.SendJsonAsync<AuthDto>(HttpMethod.Post, "/auth/login", new
        {
            email,
            password = "password123",
        });

        Assert.Equal(email, auth.Email);
        Assert.False(string.IsNullOrEmpty(auth.AccessToken));
        Assert.False(string.IsNullOrEmpty(auth.RefreshToken));
    }

    [Fact]
    public async Task Refresh_RotatesToken_AndRejectsOldOne()
    {
        var session = new TestSession(_factory);
        var auth = await RegisterAsync(session, $"refresh-{Guid.NewGuid():N}@example.com");

        var refreshed = await session.SendJsonAsync<AuthDto>(HttpMethod.Post, "/auth/refresh", new
        {
            refreshToken = auth.RefreshToken,
        });
        Assert.NotEqual(auth.RefreshToken, refreshed.RefreshToken);

        var replay = await session.SendAsync(HttpMethod.Post, "/auth/refresh", new
        {
            refreshToken = auth.RefreshToken,
        });
        Assert.Equal(HttpStatusCode.Unauthorized, replay.StatusCode);
    }

    [Fact]
    public async Task Me_WithoutToken_ReturnsUnauthorized()
    {
        var session = new TestSession(_factory);

        var response = await session.GetAsync("/auth/me");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    private static async Task<AuthDto> RegisterAsync(TestSession session, string email)
    {
        return await session.SendJsonAsync<AuthDto>(HttpMethod.Post, "/auth/register", new
        {
            email,
            password = "password123",
            displayName = "Test User",
        });
    }
}
