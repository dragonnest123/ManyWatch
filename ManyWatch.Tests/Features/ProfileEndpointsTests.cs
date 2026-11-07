using System.Net;
using System.Net.Http.Json;
using ManyWatch.Tests.Helpers;

namespace ManyWatch.Tests.Features;

public class ProfileEndpointsTests : IClassFixture<ManyWatchAppFactory>
{
    private const string OnePixelPngBase64 =
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

    private readonly ManyWatchAppFactory _factory;

    public ProfileEndpointsTests(ManyWatchAppFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task GetProfile_ReturnsRegistrationDateAndEmptyStats()
    {
        var (auth, session) = await FriendsApi.RegisterAsync(_factory, "Profile User");

        var profile = await ProfileApi.GetAsync(session, auth);

        Assert.Equal(auth.UserId, profile.UserId);
        Assert.Equal(auth.Email, profile.Email);
        Assert.Equal(auth.Username, profile.Username);
        Assert.Null(profile.Bio);
        Assert.Null(profile.AvatarUrl);
        Assert.Equal(0, profile.WatchedSeconds);
        Assert.Equal(0, profile.FriendCount);
        Assert.NotEqual(default, profile.CreatedAt);
    }

    [Fact]
    public async Task UpdateProfile_SavesDisplayNameAndBio()
    {
        var (auth, session) = await FriendsApi.RegisterAsync(_factory, "Profile User");

        var response = await ProfileApi.UpdateAsync(
            session,
            auth,
            auth.Username,
            "  Cinema Fan  ",
            "  Watching movies with friends  ");

        var profile = await ProfileApi.ReadProfileAsync(response);

        Assert.Equal("Cinema Fan", profile.DisplayName);
        Assert.Equal("Watching movies with friends", profile.Bio);

        var reloaded = await ProfileApi.GetAsync(session, auth);
        Assert.Equal("Cinema Fan", reloaded.DisplayName);
        Assert.Equal("Watching movies with friends", reloaded.Bio);
    }

    [Fact]
    public async Task UpdateProfile_EmptyBio_ClearsIt()
    {
        var (auth, session) = await FriendsApi.RegisterAsync(_factory, "Profile User");
        await ProfileApi.UpdateAsync(session, auth, auth.Username, "Profile User", "About me");

        var profile = await ProfileApi.ReadProfileAsync(
            await ProfileApi.UpdateAsync(session, auth, auth.Username, "Profile User", "   "));

        Assert.Null(profile.Bio);
    }

    [Fact]
    public async Task RecordWatchTime_AccumulatesTotal()
    {
        var (auth, session) = await FriendsApi.RegisterAsync(_factory, "Profile User");

        var first = await session.SendJsonAsync<WatchTimeDto>(
            HttpMethod.Post,
            "/profile/watch-time",
            new { seconds = 120 },
            auth.AccessToken);

        var second = await session.SendJsonAsync<WatchTimeDto>(
            HttpMethod.Post,
            "/profile/watch-time",
            new { seconds = 30 },
            auth.AccessToken);

        Assert.Equal(120, first.WatchedSeconds);
        Assert.Equal(150, second.WatchedSeconds);

        var profile = await ProfileApi.GetAsync(session, auth);
        Assert.Equal(150, profile.WatchedSeconds);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-5)]
    [InlineData(301)]
    public async Task RecordWatchTime_OutOfRange_ReturnsBadRequest(long seconds)
    {
        var (auth, session) = await FriendsApi.RegisterAsync(_factory, "Profile User");

        var response = await ProfileApi.RecordWatchTimeAsync(session, auth, seconds);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Profile_WithoutToken_ReturnsUnauthorized()
    {
        var session = new TestSession(_factory);

        var response = await session.GetAsync("/profile");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task FriendCount_IncludesOnlyAcceptedFriendships()
    {
        var (firstAuth, firstSession) = await FriendsApi.RegisterAsync(_factory, "First Friend");
        var (secondAuth, secondSession) = await FriendsApi.RegisterAsync(_factory, "Second Friend");

        await FriendsApi.MakeFriendsAsync(firstSession, firstAuth, secondSession, secondAuth);

        var firstProfile = await ProfileApi.GetAsync(firstSession, firstAuth);
        var secondProfile = await ProfileApi.GetAsync(secondSession, secondAuth);

        Assert.Equal(1, firstProfile.FriendCount);
        Assert.Equal(1, secondProfile.FriendCount);
    }

    [Fact]
    public async Task Avatar_CanBeUploadedFetchedAndRemoved()
    {
        var (auth, session) = await FriendsApi.RegisterAsync(_factory, "Profile User");
        var dataUrl = $"data:image/png;base64,{OnePixelPngBase64}";

        var uploadResponse = await ProfileApi.UploadAvatarAsync(session, auth, dataUrl);
        var avatar = await uploadResponse.Content.ReadFromJsonAsync<AvatarDto>();

        Assert.NotNull(avatar);
        Assert.StartsWith($"/users/{auth.UserId:D}/avatar?v=", avatar.AvatarUrl);

        var profile = await ProfileApi.GetAsync(session, auth);
        Assert.Equal(avatar.AvatarUrl, profile.AvatarUrl);

        var me = await session.SendJsonAsync<MeDto>(HttpMethod.Get, "/auth/me", bearerToken: auth.AccessToken);
        Assert.Equal(avatar.AvatarUrl, me.AvatarUrl);

        var login = await session.SendJsonAsync<AuthDto>(HttpMethod.Post, "/auth/login", new
        {
            email = auth.Email,
            password = "password123",
        });
        Assert.Equal(avatar.AvatarUrl, login.AvatarUrl);

        var imageResponse = await session.GetAsync(avatar.AvatarUrl);
        Assert.Equal(HttpStatusCode.OK, imageResponse.StatusCode);
        Assert.Equal("image/png", imageResponse.Content.Headers.ContentType?.MediaType);
        Assert.Equal(OnePixelPngBase64, Convert.ToBase64String(await imageResponse.Content.ReadAsByteArrayAsync()));

        var deleteResponse = await ProfileApi.DeleteAvatarAsync(session, auth);
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        var profileAfterDelete = await ProfileApi.GetAsync(session, auth);
        Assert.Null(profileAfterDelete.AvatarUrl);

        var imageAfterDelete = await session.GetAsync(avatar.AvatarUrl);
        Assert.Equal(HttpStatusCode.NotFound, imageAfterDelete.StatusCode);
    }

    [Fact]
    public async Task UpdateProfile_ChangesUsername_AndRejectsDuplicate()
    {
        var (firstAuth, firstSession) = await FriendsApi.RegisterAsync(_factory, "First User");
        var (secondAuth, _) = await FriendsApi.RegisterAsync(_factory, "Second User");
        var newUsername = $"new{Guid.NewGuid():N}"[..24];

        var response = await ProfileApi.UpdateAsync(
            firstSession,
            firstAuth,
            newUsername,
            "First User",
            null);
        var profile = await ProfileApi.ReadProfileAsync(response);
        Assert.Equal(newUsername, profile.Username);

        var duplicate = await ProfileApi.UpdateAsync(
            firstSession,
            firstAuth,
            secondAuth.Username.ToUpperInvariant(),
            "First User",
            null);
        Assert.Equal(HttpStatusCode.Conflict, duplicate.StatusCode);
    }

    [Fact]
    public async Task PublicProfile_IsAnonymousAndDoesNotExposeEmail()
    {
        var (auth, _) = await FriendsApi.RegisterAsync(_factory, "Public User");
        var guest = new TestSession(_factory);

        var profile = await ProfileApi.GetPublicAsync(guest, auth.Username.ToUpperInvariant());

        Assert.Equal(auth.UserId, profile.UserId);
        Assert.Equal(auth.Username, profile.Username);
        Assert.Equal("None", profile.Relationship);
        Assert.False(profile.IsSelf);
        Assert.Equal(0, profile.FriendCount);

        var raw = await guest.GetAsync($"/users/{auth.Username}");
        var body = await raw.Content.ReadAsStringAsync();
        Assert.DoesNotContain("email", body, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task PublicProfile_ReturnsRelationshipForViewer()
    {
        var (alice, aliceSession) = await FriendsApi.RegisterAsync(_factory, "Alice");
        var (bob, bobSession) = await FriendsApi.RegisterAsync(_factory, "Bob");

        var before = await ProfileApi.GetPublicAsync(bobSession, alice.Username, bob.AccessToken);
        Assert.Equal("None", before.Relationship);
        Assert.False(before.IsSelf);

        await FriendsApi.SendRequestAsync(aliceSession, alice, bob.UserId);

        var incoming = await ProfileApi.GetPublicAsync(bobSession, alice.Username, bob.AccessToken);
        Assert.Equal("IncomingRequest", incoming.Relationship);

        var outgoing = await ProfileApi.GetPublicAsync(aliceSession, bob.Username, alice.AccessToken);
        Assert.Equal("OutgoingRequest", outgoing.Relationship);

        var requests = await FriendsApi.GetRequestsAsync(bobSession, bob);
        await FriendsApi.AcceptRequestAsync(bobSession, bob, Assert.Single(requests.Incoming).Id);

        var friends = await ProfileApi.GetPublicAsync(bobSession, alice.Username, bob.AccessToken);
        Assert.Equal("Friends", friends.Relationship);

        var self = await ProfileApi.GetPublicAsync(aliceSession, alice.Username, alice.AccessToken);
        Assert.True(self.IsSelf);
        Assert.Equal("None", self.Relationship);
    }

    [Fact]
    public async Task PublicProfile_UnknownUsername_ReturnsNotFound()
    {
        var guest = new TestSession(_factory);
        var username = $"missing{Guid.NewGuid():N}"[..20];

        var response = await guest.GetAsync($"/users/{username}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Avatar_InvalidDataUrl_ReturnsBadRequest()
    {
        var (auth, session) = await FriendsApi.RegisterAsync(_factory, "Profile User");

        var response = await ProfileApi.UploadAvatarAsync(
            session,
            auth,
            "data:image/png;base64,bm90IGFuIGltYWdl");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
