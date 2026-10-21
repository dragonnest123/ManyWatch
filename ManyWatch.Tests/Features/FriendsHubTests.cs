using ManyWatch.Tests.Helpers;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.SignalR.Client;

namespace ManyWatch.Tests.Features;

public class FriendsHubTests : IClassFixture<ManyWatchAppFactory>
{
    private static readonly TimeSpan ReceiveTimeout = TimeSpan.FromSeconds(10);

    private readonly ManyWatchAppFactory _factory;

    public FriendsHubTests(ManyWatchAppFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task SendMessage_IsDeliveredToBothFriendsAndStoredInHistory()
    {
        var (alice, aliceSession) = await FriendsApi.RegisterAsync(_factory, "Alice");
        var (bob, bobSession) = await FriendsApi.RegisterAsync(_factory, "Bob");
        await FriendsApi.MakeFriendsAsync(aliceSession, alice, bobSession, bob);

        await using var aliceConnection = RoomHubClientFactory.Create(
            _factory, aliceSession, RoomHubClientFactory.FriendsHubPath, alice.AccessToken);
        await using var bobConnection = RoomHubClientFactory.Create(
            _factory, bobSession, RoomHubClientFactory.FriendsHubPath, bob.AccessToken);

        await aliceConnection.StartAsync();
        await bobConnection.StartAsync();

        var receivedByAlice = WaitForDirectMessage(aliceConnection);
        var receivedByBob = WaitForDirectMessage(bobConnection);

        await aliceConnection.InvokeAsync(
            "SendMessage",
            bob.UserId,
            new { content = "  Hello Bob  " });

        var aliceMessage = await receivedByAlice.Task.WaitAsync(ReceiveTimeout);
        var bobMessage = await receivedByBob.Task.WaitAsync(ReceiveTimeout);

        Assert.Equal("Hello Bob", aliceMessage.Content);
        Assert.Equal(alice.UserId, aliceMessage.SenderId);
        Assert.Equal(bob.UserId, aliceMessage.RecipientId);
        Assert.Equal(aliceMessage.Id, bobMessage.Id);

        var history = await bobConnection.InvokeAsync<List<DirectMessageDto>>(
            "GetMessages",
            alice.UserId);
        var stored = Assert.Single(history);
        Assert.Equal(aliceMessage.Id, stored.Id);

        await aliceConnection.StopAsync();
        await bobConnection.StopAsync();
    }

    [Fact]
    public async Task SendMessage_ToNonFriend_ThrowsHubException()
    {
        var (alice, aliceSession) = await FriendsApi.RegisterAsync(_factory, "Alice");
        var (stranger, strangerSession) = await FriendsApi.RegisterAsync(_factory, "Stranger");

        await using var connection = RoomHubClientFactory.Create(
            _factory, strangerSession, RoomHubClientFactory.FriendsHubPath, stranger.AccessToken);
        await connection.StartAsync();

        var error = await Assert.ThrowsAsync<HubException>(
            () => connection.InvokeAsync(
                "SendMessage",
                alice.UserId,
                new { content = "Hello" }));

        Assert.Contains("only your friends", error.Message, StringComparison.OrdinalIgnoreCase);

        await connection.StopAsync();
    }

    [Fact]
    public async Task SendMessage_WithEmptyContent_ThrowsHubException()
    {
        var (alice, aliceSession) = await FriendsApi.RegisterAsync(_factory, "Alice");
        var (bob, bobSession) = await FriendsApi.RegisterAsync(_factory, "Bob");
        await FriendsApi.MakeFriendsAsync(aliceSession, alice, bobSession, bob);

        await using var connection = RoomHubClientFactory.Create(
            _factory, aliceSession, RoomHubClientFactory.FriendsHubPath, alice.AccessToken);
        await connection.StartAsync();

        var error = await Assert.ThrowsAsync<HubException>(
            () => connection.InvokeAsync(
                "SendMessage",
                bob.UserId,
                new { content = "   " }));

        Assert.Contains("cannot be empty", error.Message, StringComparison.OrdinalIgnoreCase);

        await connection.StopAsync();
    }

    [Fact]
    public async Task GetMessages_ForNonFriend_ThrowsHubException()
    {
        var (alice, aliceSession) = await FriendsApi.RegisterAsync(_factory, "Alice");
        var (stranger, strangerSession) = await FriendsApi.RegisterAsync(_factory, "Stranger");

        await using var connection = RoomHubClientFactory.Create(
            _factory, strangerSession, RoomHubClientFactory.FriendsHubPath, stranger.AccessToken);
        await connection.StartAsync();

        var error = await Assert.ThrowsAsync<HubException>(
            () => connection.InvokeAsync<List<DirectMessageDto>>("GetMessages", alice.UserId));

        Assert.Contains("only your friends", error.Message, StringComparison.OrdinalIgnoreCase);

        await connection.StopAsync();
    }

    [Fact]
    public async Task Hub_RejectsConnectionWithoutAccessToken()
    {
        var (_, aliceSession) = await FriendsApi.RegisterAsync(_factory, "Alice");

        await using var connection = RoomHubClientFactory.Create(
            _factory, aliceSession, RoomHubClientFactory.FriendsHubPath);

        await Assert.ThrowsAnyAsync<Exception>(() => connection.StartAsync());
    }

    private static TaskCompletionSource<DirectMessageDto> WaitForDirectMessage(HubConnection connection)
    {
        var completion = new TaskCompletionSource<DirectMessageDto>(
            TaskCreationOptions.RunContinuationsAsynchronously);

        connection.On<DirectMessageDto>(
            "DirectMessageReceived",
            message => completion.TrySetResult(message));

        return completion;
    }
}
