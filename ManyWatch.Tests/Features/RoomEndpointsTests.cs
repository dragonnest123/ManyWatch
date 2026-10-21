using System.Net;
using ManyWatch.Tests.Helpers;

namespace ManyWatch.Tests.Features;

public class RoomEndpointsTests : IClassFixture<ManyWatchAppFactory>
{
    private readonly ManyWatchAppFactory _factory;

    public RoomEndpointsTests(ManyWatchAppFactory factory)
    {
        _factory = factory;
    }

    private TestSession NewSession()
    {
        return new TestSession(_factory);
    }

    [Fact]
    public async Task CreateRoom_RegistersHostAsMember()
    {
        var host = NewSession();

        var room = await RoomsApi.CreateAsync(host, $"create-{Guid.NewGuid():N}");

        var member = Assert.Single(room.Members);
        Assert.True(member.IsHost);
        Assert.True(member.IsMe);

        var fetched = await RoomsApi.TryGetAsync(host, room.Id);
        Assert.NotNull(fetched);
        Assert.Equal(room.Id, fetched.Id);
        Assert.Equal(room.Name, fetched.Name);
    }

    [Fact]
    public async Task CreateRoom_EmptyName_ReturnsValidationProblem()
    {
        var host = NewSession();

        var response = await host.SendAsync(HttpMethod.Post, "/rooms/create", new { name = "" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GetRoom_UnknownId_Returns404()
    {
        var host = NewSession();

        var response = await host.GetAsync($"/rooms/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task JoinRoom_AddsSecondMember()
    {
        var host = NewSession();
        var guest = NewSession();
        await guest.EnsureIdentityAsync();
        var room = await RoomsApi.CreateAsync(host, $"join-{Guid.NewGuid():N}");

        var joined = await RoomsApi.JoinAsync(guest, room.Id);

        Assert.Equal(2, joined.Members.Count);
        Assert.True(RoomsApi.Me(joined).IsMe);
        Assert.False(RoomsApi.Me(joined).IsHost);
        Assert.Single(joined.Members, member => member.IsHost);
    }

    [Fact]
    public async Task JoinRoom_AlreadyMember_IsIdempotent()
    {
        var host = NewSession();
        var guest = NewSession();
        await guest.EnsureIdentityAsync();
        var room = await RoomsApi.CreateAsync(host, $"rejoin-{Guid.NewGuid():N}");
        await RoomsApi.JoinAsync(guest, room.Id);

        var rejoined = await RoomsApi.JoinAsync(guest, room.Id);

        Assert.Equal(2, rejoined.Members.Count);
    }

    [Fact]
    public async Task JoinRoom_PrivateRoomByDirectLink_Succeeds()
    {
        var host = NewSession();
        var guest = NewSession();
        await guest.EnsureIdentityAsync();
        var room = await RoomsApi.CreateAsync(host, $"private-{Guid.NewGuid():N}", isPrivate: true);
        Assert.True(room.IsPrivate);

        var joined = await RoomsApi.JoinAsync(guest, room.Id);

        Assert.Equal(2, joined.Members.Count);
    }

    [Fact]
    public async Task JoinRoom_BannedUser_ReturnsForbidden()
    {
        var host = NewSession();
        var guest = NewSession();
        await guest.EnsureIdentityAsync();
        var room = await RoomsApi.CreateAsync(host, $"ban-{Guid.NewGuid():N}");
        var joined = await RoomsApi.JoinAsync(guest, room.Id);
        var guestId = RoomsApi.Me(joined).UserId;

        var banResponse = await RoomsApi.BanAsync(host, room.Id, guestId);
        Assert.Equal(HttpStatusCode.NoContent, banResponse.StatusCode);

        var rejoinResponse = await RoomsApi.TryJoinAsync(guest, room.Id);
        Assert.Equal(HttpStatusCode.Forbidden, rejoinResponse.StatusCode);
    }

    [Fact]
    public async Task BanMember_RemovesFromMembersAndShowsInBanListForHost()
    {
        var host = NewSession();
        var guest = NewSession();
        await guest.EnsureIdentityAsync();
        var room = await RoomsApi.CreateAsync(host, $"banlist-{Guid.NewGuid():N}");
        var guestId = RoomsApi.Me(await RoomsApi.JoinAsync(guest, room.Id)).UserId;

        await RoomsApi.BanAsync(host, room.Id, guestId);
        var hostView = await RoomsApi.TryGetAsync(host, room.Id);

        Assert.NotNull(hostView);
        Assert.DoesNotContain(hostView.Members, member => member.UserId == guestId);
        Assert.Contains(hostView.Bans, ban => ban.UserId == guestId);
    }

    [Fact]
    public async Task UnbanMember_AllowsBannedUserToJoinAgain()
    {
        var host = NewSession();
        var guest = NewSession();
        await guest.EnsureIdentityAsync();
        var room = await RoomsApi.CreateAsync(host, $"unban-{Guid.NewGuid():N}");
        var guestId = RoomsApi.Me(await RoomsApi.JoinAsync(guest, room.Id)).UserId;
        await RoomsApi.BanAsync(host, room.Id, guestId);

        var unbanResponse = await RoomsApi.UnbanAsync(host, room.Id, guestId);
        Assert.Equal(HttpStatusCode.NoContent, unbanResponse.StatusCode);

        var rejoin = await RoomsApi.TryJoinAsync(guest, room.Id);
        Assert.Equal(HttpStatusCode.OK, rejoin.StatusCode);
    }

    [Fact]
    public async Task BanMember_NonHost_ReturnsForbidden()
    {
        var host = NewSession();
        var guest = NewSession();
        await guest.EnsureIdentityAsync();
        var room = await RoomsApi.CreateAsync(host, $"banhost-{Guid.NewGuid():N}");
        var hostId = RoomsApi.Me(room).UserId;
        await RoomsApi.JoinAsync(guest, room.Id);

        var response = await RoomsApi.BanAsync(guest, room.Id, hostId);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task JoinRoom_AuthorizedOnlyPolicy_RejectsAnonymousButAcceptsSignedIn()
    {
        var host = NewSession();
        var guest = NewSession();
        await guest.EnsureIdentityAsync();
        var room = await RoomsApi.CreateAsync(host, $"authonly-{Guid.NewGuid():N}");
        var settingsResponse = await RoomsApi.UpdateSettingsAsync(
            host,
            room.Id,
            isPrivate: false,
            maxMembers: null,
            joinPolicy: "AuthorizedOnly");
        Assert.Equal(HttpStatusCode.OK, settingsResponse.StatusCode);

        var anonymousAttempt = await RoomsApi.TryJoinAsync(guest, room.Id);
        Assert.Equal(HttpStatusCode.Forbidden, anonymousAttempt.StatusCode);

        var email = $"guest-{Guid.NewGuid():N}@example.com";
        var auth = await guest.SendJsonAsync<AuthDto>(
            HttpMethod.Post,
            "/auth/register",
            new { email, password = "password123", displayName = "Guest" });

        var signedInAttempt = await guest.SendAsync(
            HttpMethod.Post,
            $"/rooms/{room.Id}/join",
            bearerToken: auth.AccessToken);
        Assert.Equal(HttpStatusCode.OK, signedInAttempt.StatusCode);
    }

    [Fact]
    public async Task JoinRoom_WhenMaxMembersReached_ReturnsConflict()
    {
        var host = NewSession();
        var first = NewSession();
        var second = NewSession();
        await first.EnsureIdentityAsync();
        await second.EnsureIdentityAsync();
        var room = await RoomsApi.CreateAsync(host, $"full-{Guid.NewGuid():N}");
        await RoomsApi.UpdateSettingsAsync(host, room.Id, isPrivate: false, maxMembers: 2, joinPolicy: "Everyone");
        await RoomsApi.JoinAsync(first, room.Id);

        var response = await RoomsApi.TryJoinAsync(second, room.Id);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task LeaveRoom_WhenHostLeaves_TransfersHostToOldestMember()
    {
        var host = NewSession();
        var firstGuest = NewSession();
        var secondGuest = NewSession();
        await firstGuest.EnsureIdentityAsync();
        await secondGuest.EnsureIdentityAsync();
        var room = await RoomsApi.CreateAsync(host, $"transfer-{Guid.NewGuid():N}");
        await RoomsApi.JoinAsync(firstGuest, room.Id);
        await RoomsApi.JoinAsync(secondGuest, room.Id);

        var leaveResponse = await RoomsApi.LeaveAsync(host, room.Id);
        Assert.Equal(HttpStatusCode.NoContent, leaveResponse.StatusCode);

        var roomAfter = await RoomsApi.TryGetAsync(firstGuest, room.Id);
        Assert.NotNull(roomAfter);
        Assert.Equal(2, roomAfter.Members.Count);
        Assert.True(RoomsApi.Me(roomAfter).IsHost);
        Assert.Single(roomAfter.Members, member => member.IsHost);
    }

    [Fact]
    public async Task LeaveRoom_WhenLastMemberLeaves_DeletesRoom()
    {
        var host = NewSession();
        var room = await RoomsApi.CreateAsync(host, $"last-{Guid.NewGuid():N}");

        var leaveResponse = await RoomsApi.LeaveAsync(host, room.Id);
        Assert.Equal(HttpStatusCode.NoContent, leaveResponse.StatusCode);

        var getResponse = await host.GetAsync($"/rooms/{room.Id}");
        Assert.Equal(HttpStatusCode.NotFound, getResponse.StatusCode);
    }

    [Fact]
    public async Task LeaveRoom_NonMember_ReturnsNotFound()
    {
        var host = NewSession();
        var stranger = NewSession();
        await stranger.EnsureIdentityAsync();
        var room = await RoomsApi.CreateAsync(host, $"leave-{Guid.NewGuid():N}");

        var response = await RoomsApi.LeaveAsync(stranger, room.Id);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task UpdateSettings_NonHost_ReturnsForbidden()
    {
        var host = NewSession();
        var guest = NewSession();
        await guest.EnsureIdentityAsync();
        var room = await RoomsApi.CreateAsync(host, $"settings-{Guid.NewGuid():N}");

        var response = await RoomsApi.UpdateSettingsAsync(guest, room.Id, isPrivate: true, maxMembers: 5, joinPolicy: "Everyone");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task UpdateSettings_Host_AppliesValues()
    {
        var host = NewSession();
        var room = await RoomsApi.CreateAsync(host, $"settingsok-{Guid.NewGuid():N}");

        var response = await RoomsApi.UpdateSettingsAsync(host, room.Id, isPrivate: true, maxMembers: 5, joinPolicy: "AuthorizedOnly");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var updated = await RoomsApi.TryGetAsync(host, room.Id);
        Assert.NotNull(updated);
        Assert.True(updated.IsPrivate);
        Assert.Equal(5, updated.MaxMembers);
        Assert.Equal("AuthorizedOnly", updated.JoinPolicy);
    }

    [Fact]
    public async Task UpdateSettings_MaxMembersBelowMemberCount_ReturnsBadRequest()
    {
        var host = NewSession();
        var first = NewSession();
        var second = NewSession();
        await first.EnsureIdentityAsync();
        await second.EnsureIdentityAsync();
        var room = await RoomsApi.CreateAsync(host, $"toolow-{Guid.NewGuid():N}");
        await RoomsApi.JoinAsync(first, room.Id);
        await RoomsApi.JoinAsync(second, room.Id);

        var response = await RoomsApi.UpdateSettingsAsync(host, room.Id, isPrivate: false, maxMembers: 2, joinPolicy: "Everyone");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(501)]
    public async Task UpdateSettings_MaxMembersOutOfRange_ReturnsValidationProblem(int maxMembers)
    {
        var host = NewSession();
        var room = await RoomsApi.CreateAsync(host, $"range-{Guid.NewGuid():N}");

        var response = await RoomsApi.UpdateSettingsAsync(host, room.Id, isPrivate: false, maxMembers, joinPolicy: "Everyone");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task UpdateSettings_MaxMembersOne_AllowsHostButBlocksSecondViewer()
    {
        var host = NewSession();
        var guest = NewSession();
        await guest.EnsureIdentityAsync();
        var room = await RoomsApi.CreateAsync(host, $"solo-{Guid.NewGuid():N}");

        var settingsResponse = await RoomsApi.UpdateSettingsAsync(
            host,
            room.Id,
            isPrivate: false,
            maxMembers: 1,
            joinPolicy: "Everyone");
        Assert.Equal(HttpStatusCode.OK, settingsResponse.StatusCode);

        var joinResponse = await RoomsApi.TryJoinAsync(guest, room.Id);

        Assert.Equal(HttpStatusCode.Conflict, joinResponse.StatusCode);
    }

    [Fact]
    public async Task RenameRoom_Host_UpdatesName()
    {
        var host = NewSession();
        var room = await RoomsApi.CreateAsync(host, $"rename-{Guid.NewGuid():N}");

        var response = await RoomsApi.RenameAsync(host, room.Id, "renamed room");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var updated = await RoomsApi.TryGetAsync(host, room.Id);
        Assert.Equal("renamed room", updated!.Name);
    }

    [Fact]
    public async Task RenameRoom_NonHost_ReturnsForbidden()
    {
        var host = NewSession();
        var guest = NewSession();
        await guest.EnsureIdentityAsync();
        var room = await RoomsApi.CreateAsync(host, $"renamefail-{Guid.NewGuid():N}");

        var response = await RoomsApi.RenameAsync(guest, room.Id, "hijacked");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        var roomAfter = await RoomsApi.TryGetAsync(host, room.Id);
        Assert.NotEqual("hijacked", roomAfter!.Name);
    }

    [Fact]
    public async Task DeleteRoom_Host_RemovesRoom()
    {
        var host = NewSession();
        var room = await RoomsApi.CreateAsync(host, $"delete-{Guid.NewGuid():N}");

        var response = await RoomsApi.DeleteAsync(host, room.Id);
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        var getResponse = await host.GetAsync($"/rooms/{room.Id}");
        Assert.Equal(HttpStatusCode.NotFound, getResponse.StatusCode);
    }

    [Fact]
    public async Task DeleteRoom_NonHost_ReturnsForbidden()
    {
        var host = NewSession();
        var guest = NewSession();
        await guest.EnsureIdentityAsync();
        var room = await RoomsApi.CreateAsync(host, $"deletefail-{Guid.NewGuid():N}");
        await RoomsApi.JoinAsync(guest, room.Id);

        var response = await RoomsApi.DeleteAsync(guest, room.Id);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Heartbeat_MemberSucceeds_NonMemberReturnsNotFound()
    {
        var host = NewSession();
        var guest = NewSession();
        await guest.EnsureIdentityAsync();
        var room = await RoomsApi.CreateAsync(host, $"heartbeat-{Guid.NewGuid():N}");
        await RoomsApi.JoinAsync(guest, room.Id);

        var memberResponse = await guest.SendAsync(HttpMethod.Post, $"/rooms/{room.Id}/heartbeat");
        Assert.Equal(HttpStatusCode.NoContent, memberResponse.StatusCode);

        var stranger = NewSession();
        await stranger.EnsureIdentityAsync();
        var strangerResponse = await stranger.SendAsync(HttpMethod.Post, $"/rooms/{room.Id}/heartbeat");
        Assert.Equal(HttpStatusCode.NotFound, strangerResponse.StatusCode);
    }
}