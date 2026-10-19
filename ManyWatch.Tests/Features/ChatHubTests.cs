using ManyWatch.Domain;
using ManyWatch.Infrastructure.Persistence;
using ManyWatch.Tests.Helpers;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace ManyWatch.Tests.Features;

public class ChatHubTests : IClassFixture<ManyWatchAppFactory>
{
    private static readonly TimeSpan ReceiveTimeout = TimeSpan.FromSeconds(10);

    private readonly ManyWatchAppFactory _factory;

    public ChatHubTests(ManyWatchAppFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task SendMessage_BroadcastsTrimmedMessageToAllMembers()
    {
        var (host, room) = await CreateRoomAsync();
        var guest = await CreateSessionAsync();
        await RoomsApi.JoinAsync(guest, room.Id);

        await using var hostConnection = RoomHubClientFactory.Create(_factory, host);
        await using var guestConnection = RoomHubClientFactory.Create(_factory, guest);

        await hostConnection.StartAsync();
        await guestConnection.StartAsync();
        await hostConnection.InvokeAsync<RoomPlaybackDto?>("JoinRoom", room.Id);
        await guestConnection.InvokeAsync<RoomPlaybackDto?>("JoinRoom", room.Id);

        var receivedByHost = WaitForChatMessage(hostConnection);
        var receivedByGuest = WaitForChatMessage(guestConnection);

        await hostConnection.InvokeAsync("SendMessage", room.Id, new { content = "  Hello room  " });

        var hostMessage = await receivedByHost.Task.WaitAsync(ReceiveTimeout);
        var guestMessage = await receivedByGuest.Task.WaitAsync(ReceiveTimeout);

        Assert.Equal("Hello room", hostMessage.Content);
        Assert.Equal(RoomsApi.Me(room).UserId, hostMessage.UserId);
        Assert.NotEqual(Guid.Empty, hostMessage.Id);
        Assert.Equal(hostMessage.Id, guestMessage.Id);

        await hostConnection.StopAsync();
        await guestConnection.StopAsync();
    }

    [Fact]
    public async Task SendMessage_NonMember_ThrowsHubException()
    {
        var host = await CreateSessionAsync();
        var stranger = await CreateSessionAsync();
        var room = await RoomsApi.CreateAsync(host, $"chat-nonmember-{Guid.NewGuid():N}");

        await using var connection = RoomHubClientFactory.Create(_factory, stranger);
        await connection.StartAsync();

        var error = await Assert.ThrowsAsync<HubException>(
            () => connection.InvokeAsync("SendMessage", room.Id, new { content = "Hello" }));

        Assert.Contains("not a member", error.Message, StringComparison.OrdinalIgnoreCase);

        await connection.StopAsync();
    }

    [Fact]
    public async Task SendMessage_EmptyContent_ThrowsHubException()
    {
        var (host, room) = await CreateRoomAsync();

        await using var connection = RoomHubClientFactory.Create(_factory, host);
        await connection.StartAsync();

        var error = await Assert.ThrowsAsync<HubException>(
            () => connection.InvokeAsync("SendMessage", room.Id, new { content = "   " }));

        Assert.Contains("cannot be empty", error.Message, StringComparison.OrdinalIgnoreCase);

        await connection.StopAsync();
    }

    [Fact]
    public async Task SendMessage_TooLongContent_ThrowsHubException()
    {
        var (host, room) = await CreateRoomAsync();

        await using var connection = RoomHubClientFactory.Create(_factory, host);
        await connection.StartAsync();

        var content = new string('a', ChatMessage.MaxContentLength + 1);

        var error = await Assert.ThrowsAsync<HubException>(
            () => connection.InvokeAsync("SendMessage", room.Id, new { content }));

        Assert.Contains(ChatMessage.MaxContentLength.ToString(), error.Message);

        await connection.StopAsync();
    }

    [Fact]
    public async Task GetMessages_ReturnsMostRecentMessagesInOrder()
    {
        var (host, room) = await CreateRoomAsync();
        var hostId = RoomsApi.Me(room).UserId;

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var start = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);

            db.ChatMessages.AddRange(Enumerable.Range(0, 105)
                .Select(index => new ChatMessage(
                    room.Id,
                    hostId,
                    $"message {index}",
                    start.AddSeconds(index))));

            await db.SaveChangesAsync();
        }

        await using var connection = RoomHubClientFactory.Create(_factory, host);
        await connection.StartAsync();

        var messages = await connection.InvokeAsync<List<ChatMessageDto>>("GetMessages", room.Id);

        var expectedCount = 100;
        Assert.Equal(expectedCount, messages.Count);
        Assert.Equal("message 5", messages[0].Content);
        Assert.Equal("message 104", messages[^1].Content);
        Assert.True(messages
            .Zip(messages.Skip(1))
            .All(pair => pair.First.SentAtUtc <= pair.Second.SentAtUtc));

        await connection.StopAsync();
    }

    [Fact]
    public async Task GetMessages_NonMember_ThrowsHubException()
    {
        var host = await CreateSessionAsync();
        var stranger = await CreateSessionAsync();
        var room = await RoomsApi.CreateAsync(host, $"chat-history-nonmember-{Guid.NewGuid():N}");

        await using var connection = RoomHubClientFactory.Create(_factory, stranger);
        await connection.StartAsync();

        var error = await Assert.ThrowsAsync<HubException>(
            () => connection.InvokeAsync<List<ChatMessageDto>>("GetMessages", room.Id));

        Assert.Contains("not a member", error.Message, StringComparison.OrdinalIgnoreCase);

        await connection.StopAsync();
    }

    private async Task<TestSession> CreateSessionAsync()
    {
        var session = new TestSession(_factory);
        await session.EnsureIdentityAsync();
        return session;
    }

    private async Task<(TestSession Host, RoomDto Room)> CreateRoomAsync()
    {
        var host = await CreateSessionAsync();
        var room = await RoomsApi.CreateAsync(host, $"chat-{Guid.NewGuid():N}");
        return (host, room);
    }

    private static TaskCompletionSource<ChatMessageDto> WaitForChatMessage(HubConnection connection)
    {
        var completion = new TaskCompletionSource<ChatMessageDto>(
            TaskCreationOptions.RunContinuationsAsynchronously);

        connection.On<ChatMessageDto>("ChatMessageReceived", message => completion.TrySetResult(message));
        return completion;
    }
}
