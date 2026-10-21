using System.Net;
using System.Net.Http.Json;
using ManyWatch.Tests.Helpers;

namespace ManyWatch.Tests.Features;

public class FriendsEndpointsTests : IClassFixture<ManyWatchAppFactory>
{
    private readonly ManyWatchAppFactory _factory;

    public FriendsEndpointsTests(ManyWatchAppFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task SearchSendAccept_CreatesMutualFriendship()
    {
        var (alice, aliceSession) = await FriendsApi.RegisterAsync(_factory, "Alice");
        var (bob, bobSession) = await FriendsApi.RegisterAsync(_factory, "Bob");

        var search = await FriendsApi.SearchAsync(aliceSession, alice, bob.DisplayName);
        var found = Assert.Single(search, result => result.UserId == bob.UserId);
        Assert.Equal("None", found.Relationship);

        var response = await FriendsApi.SendRequestAsync(aliceSession, alice, bob.UserId);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var bobRequests = await FriendsApi.GetRequestsAsync(bobSession, bob);
        var incoming = Assert.Single(bobRequests.Incoming);
        Assert.Equal(alice.UserId, incoming.UserId);
        Assert.Empty(bobRequests.Outgoing);

        var aliceRequests = await FriendsApi.GetRequestsAsync(aliceSession, alice);
        Assert.Empty(aliceRequests.Incoming);
        var outgoing = Assert.Single(aliceRequests.Outgoing);
        Assert.Equal(bob.UserId, outgoing.UserId);

        response = await FriendsApi.AcceptRequestAsync(bobSession, bob, incoming.Id);
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        var aliceFriends = await FriendsApi.GetFriendsAsync(aliceSession, alice);
        var bobFriends = await FriendsApi.GetFriendsAsync(bobSession, bob);
        Assert.Equal(bob.UserId, Assert.Single(aliceFriends).UserId);
        Assert.Equal(alice.UserId, Assert.Single(bobFriends).UserId);

        search = await FriendsApi.SearchAsync(aliceSession, alice, bob.DisplayName);
        Assert.Equal(
            "Friends",
            Assert.Single(search, result => result.UserId == bob.UserId).Relationship);
    }

    [Fact]
    public async Task ReciprocalRequests_AreAutoAccepted()
    {
        var (alice, aliceSession) = await FriendsApi.RegisterAsync(_factory, "Alice");
        var (bob, bobSession) = await FriendsApi.RegisterAsync(_factory, "Bob");

        var response = await FriendsApi.SendRequestAsync(aliceSession, alice, bob.UserId);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        response = await FriendsApi.SendRequestAsync(bobSession, bob, alice.UserId);
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        Assert.Equal(bob.UserId, Assert.Single(await FriendsApi.GetFriendsAsync(aliceSession, alice)).UserId);
        Assert.Equal(alice.UserId, Assert.Single(await FriendsApi.GetFriendsAsync(bobSession, bob)).UserId);

        var aliceRequests = await FriendsApi.GetRequestsAsync(aliceSession, alice);
        Assert.Empty(aliceRequests.Incoming);
        Assert.Empty(aliceRequests.Outgoing);
    }

    [Fact]
    public async Task DuplicateAndSelfFriendRequests_AreRejected()
    {
        var (alice, aliceSession) = await FriendsApi.RegisterAsync(_factory, "Alice");
        var (bob, _) = await FriendsApi.RegisterAsync(_factory, "Bob");

        var response = await FriendsApi.SendRequestAsync(aliceSession, alice, alice.UserId);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        response = await FriendsApi.SendRequestAsync(aliceSession, alice, bob.UserId);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        response = await FriendsApi.SendRequestAsync(aliceSession, alice, bob.UserId);
        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task DeclinedRequestAndRemovedFriendship_DisappearFromDirectory()
    {
        var (alice, aliceSession) = await FriendsApi.RegisterAsync(_factory, "Alice");
        var (bob, bobSession) = await FriendsApi.RegisterAsync(_factory, "Bob");

        await FriendsApi.SendRequestAsync(aliceSession, alice, bob.UserId);
        var bobRequests = await FriendsApi.GetRequestsAsync(bobSession, bob);
        var incoming = Assert.Single(bobRequests.Incoming);

        var response = await FriendsApi.DeleteRequestAsync(bobSession, bob, incoming.Id);
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        var search = await FriendsApi.SearchAsync(aliceSession, alice, bob.DisplayName);
        Assert.Equal(
            "None",
            Assert.Single(search, result => result.UserId == bob.UserId).Relationship);

        await FriendsApi.MakeFriendsAsync(aliceSession, alice, bobSession, bob);

        response = await FriendsApi.RemoveFriendAsync(aliceSession, alice, bob.UserId);
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        Assert.Empty(await FriendsApi.GetFriendsAsync(aliceSession, alice));
        Assert.Empty(await FriendsApi.GetFriendsAsync(bobSession, bob));

        response = await FriendsApi.RemoveFriendAsync(aliceSession, alice, bob.UserId);
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task RoomInvitation_CanBeSentAndAccepted()
    {
        var (alice, aliceSession) = await FriendsApi.RegisterAsync(_factory, "Alice");
        var (bob, bobSession) = await FriendsApi.RegisterAsync(_factory, "Bob");
        await FriendsApi.MakeFriendsAsync(aliceSession, alice, bobSession, bob);

        var roomOwner = new TestSession(_factory);
        await roomOwner.EnsureIdentityAsync();
        var room = await RoomsApi.CreateAsync(roomOwner, $"invite-{Guid.NewGuid():N}", isPrivate: true);

        var invitation = await FriendsApi.InviteToRoomAsync(
            aliceSession,
            alice,
            bob.UserId,
            room.Id);
        Assert.Equal(room.Id, invitation.RoomId);
        Assert.Equal(alice.DisplayName, invitation.SenderDisplayName);

        var duplicate = await FriendsApi.InviteAsync(aliceSession, alice, bob.UserId, room.Id);
        Assert.Equal(HttpStatusCode.Conflict, duplicate.StatusCode);

        var invitations = await FriendsApi.GetInvitationsAsync(bobSession, bob);
        var received = Assert.Single(invitations);
        Assert.Equal(room.Name, received.RoomName);

        var response = await FriendsApi.AcceptInvitationAsync(bobSession, bob, received.Id);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var accepted = await response.Content.ReadFromJsonAsync<AcceptedRoomInvitationDto>();
        Assert.Equal(room.Id, accepted!.RoomId);
        Assert.Empty(await FriendsApi.GetInvitationsAsync(bobSession, bob));
    }

    [Fact]
    public async Task RoomInvitation_ToNonFriend_IsForbidden()
    {
        var (alice, aliceSession) = await FriendsApi.RegisterAsync(_factory, "Alice");
        var (stranger, _) = await FriendsApi.RegisterAsync(_factory, "Stranger");

        var roomOwner = new TestSession(_factory);
        await roomOwner.EnsureIdentityAsync();
        var room = await RoomsApi.CreateAsync(roomOwner, $"invite-stranger-{Guid.NewGuid():N}");

        var response = await FriendsApi.InviteAsync(
            aliceSession,
            alice,
            stranger.UserId,
            room.Id);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task FriendsEndpoints_RequireAuthentication()
    {
        var session = new TestSession(_factory);
        await session.EnsureIdentityAsync();

        Assert.Equal(HttpStatusCode.Unauthorized, (await session.GetAsync("/friends")).StatusCode);
        Assert.Equal(
            HttpStatusCode.Unauthorized,
            (await session.GetAsync("/friends/requests")).StatusCode);
        Assert.Equal(
            HttpStatusCode.Unauthorized,
            (await session.GetAsync("/friends/search?query=ab")).StatusCode);
        Assert.Equal(
            HttpStatusCode.Unauthorized,
            (await session.GetAsync("/friends/invitations")).StatusCode);
    }
}
