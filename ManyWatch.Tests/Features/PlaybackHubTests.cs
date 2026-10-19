using ManyWatch.Tests.Helpers;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.SignalR.Client;

namespace ManyWatch.Tests.Features;

public class PlaybackHubTests : IClassFixture<ManyWatchAppFactory>
{
    private const string VideoUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

    private static readonly TimeSpan ReceiveTimeout = TimeSpan.FromSeconds(10);

    private readonly ManyWatchAppFactory _factory;

    public PlaybackHubTests(ManyWatchAppFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task JoinRoom_NonMember_ThrowsHubException()
    {
        var host = new TestSession(_factory);
        var stranger = await CreateSessionAsync();
        var room = await RoomsApi.CreateAsync(host, $"hub-nonmember-{Guid.NewGuid():N}");

        await using var connection = RoomHubClientFactory.Create(_factory, stranger);
        await connection.StartAsync();

        var error = await Assert.ThrowsAsync<HubException>(
            () => connection.InvokeAsync<RoomPlaybackDto?>("JoinRoom", room.Id));

        Assert.Contains("not a member", error.Message, StringComparison.OrdinalIgnoreCase);

        await connection.StopAsync();
    }

    [Fact]
    public async Task JoinRoom_WithoutSelectedVideo_ReturnsNullPlayback()
    {
        var (host, room) = await CreateRoomAsync();

        await using var connection = RoomHubClientFactory.Create(_factory, host);
        await connection.StartAsync();

        var playback = await connection.InvokeAsync<RoomPlaybackDto?>("JoinRoom", room.Id);

        Assert.Null(playback);

        await connection.StopAsync();
    }

    [Fact]
    public async Task UpdatePlayback_BroadcastsStateToAllMembers()
    {
        var (host, room) = await CreateRoomAsync();
        var guest = await CreateSessionAsync();
        await RoomsApi.JoinAsync(guest, room.Id);

        await using var hostConnection = RoomHubClientFactory.Create(_factory, host);
        await using var guestConnection = RoomHubClientFactory.Create(_factory, guest);

        var guestState = WaitForPlaybackUpdate(guestConnection);
        var hostState = WaitForPlaybackUpdate(hostConnection);

        await hostConnection.StartAsync();
        await guestConnection.StartAsync();
        await hostConnection.InvokeAsync<RoomPlaybackDto?>("JoinRoom", room.Id);
        await guestConnection.InvokeAsync<RoomPlaybackDto?>("JoinRoom", room.Id);

        await hostConnection.InvokeAsync("UpdatePlayback", room.Id, new
        {
            videoUrl = VideoUrl,
            isPlaying = false,
            positionSeconds = 5.0,
            durationSeconds = 100.0,
        });

        var receivedByHost = await hostState.Task.WaitAsync(ReceiveTimeout);
        var receivedByGuest = await guestState.Task.WaitAsync(ReceiveTimeout);

        Assert.Equal(VideoUrl, receivedByHost.VideoUrl);
        Assert.Equal(5.0, receivedByHost.PositionSeconds, precision: 3);
        Assert.Equal(VideoUrl, receivedByGuest.VideoUrl);
        Assert.Equal(5.0, receivedByGuest.PositionSeconds, precision: 3);

        await hostConnection.StopAsync();
        await guestConnection.StopAsync();
    }

    [Fact]
    public async Task UpdatePlayback_ClampsPositionToValidRange()
    {
        var (host, room) = await CreateRoomAsync();

        await using var connection = RoomHubClientFactory.Create(_factory, host);
        await connection.StartAsync();
        await connection.InvokeAsync<RoomPlaybackDto?>("JoinRoom", room.Id);

        var negativePosition = WaitForPlaybackUpdate(connection);
        await connection.InvokeAsync("UpdatePlayback", room.Id, new
        {
            videoUrl = VideoUrl,
            isPlaying = false,
            positionSeconds = -5.0,
            durationSeconds = 30.0,
        });
        Assert.Equal(0.0, (await negativePosition.Task.WaitAsync(ReceiveTimeout)).PositionSeconds, precision: 3);

        var beyondDuration = WaitForPlaybackUpdate(connection);
        await connection.InvokeAsync("UpdatePlayback", room.Id, new
        {
            videoUrl = (string?)null,
            isPlaying = false,
            positionSeconds = 40.0,
            durationSeconds = 30.0,
        });
        var clamped = await beyondDuration.Task.WaitAsync(ReceiveTimeout);
        Assert.Equal(VideoUrl, clamped.VideoUrl);
        Assert.Equal(30.0, clamped.PositionSeconds, precision: 3);

        await connection.StopAsync();
    }

    [Fact]
    public async Task UpdatePlayback_InvalidUrl_ThrowsHubException()
    {
        var (host, room) = await CreateRoomAsync();

        await using var connection = RoomHubClientFactory.Create(_factory, host);
        await connection.StartAsync();
        await connection.InvokeAsync<RoomPlaybackDto?>("JoinRoom", room.Id);

        var error = await Assert.ThrowsAsync<HubException>(() => connection.InvokeAsync(
            "UpdatePlayback",
            room.Id,
            new
            {
                videoUrl = "not a link",
                isPlaying = false,
                positionSeconds = 0.0,
                durationSeconds = 0.0,
            }));

        Assert.Contains("http", error.Message, StringComparison.OrdinalIgnoreCase);

        await connection.StopAsync();
    }

    [Fact]
    public async Task UpdatePlayback_WithoutSelectedVideo_ThrowsHubException()
    {
        var (host, room) = await CreateRoomAsync();

        await using var connection = RoomHubClientFactory.Create(_factory, host);
        await connection.StartAsync();
        await connection.InvokeAsync<RoomPlaybackDto?>("JoinRoom", room.Id);

        var error = await Assert.ThrowsAsync<HubException>(() => connection.InvokeAsync(
            "UpdatePlayback",
            room.Id,
            new
            {
                videoUrl = (string?)null,
                isPlaying = false,
                positionSeconds = 0.0,
                durationSeconds = 0.0,
            }));

        Assert.Contains("Select a video", error.Message, StringComparison.OrdinalIgnoreCase);

        await connection.StopAsync();
    }

    [Fact]
    public async Task RequestPlaybackState_ExtrapolatesPositionWhilePlaying()
    {
        var (host, room) = await CreateRoomAsync();

        await using var connection = RoomHubClientFactory.Create(_factory, host);
        await connection.StartAsync();
        await connection.InvokeAsync<RoomPlaybackDto?>("JoinRoom", room.Id);

        await connection.InvokeAsync("UpdatePlayback", room.Id, new
        {
            videoUrl = VideoUrl,
            isPlaying = true,
            positionSeconds = 10.0,
            durationSeconds = 100.0,
        });

        await Task.Delay(300);

        var state = await connection.InvokeAsync<RoomPlaybackDto?>("RequestPlaybackState", room.Id);

        Assert.NotNull(state);
        Assert.True(state.PositionSeconds > 10.0, $"Expected extrapolated position, got {state.PositionSeconds}");
        Assert.True(state.PositionSeconds < 100.0, $"Expected position below duration, got {state.PositionSeconds}");

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
        var room = await RoomsApi.CreateAsync(host, $"hub-{Guid.NewGuid():N}");
        return (host, room);
    }

    private static TaskCompletionSource<RoomPlaybackDto> WaitForPlaybackUpdate(HubConnection connection)
    {
        var completion = new TaskCompletionSource<RoomPlaybackDto>(TaskCreationOptions.RunContinuationsAsynchronously);
        connection.On<RoomPlaybackDto>("PlaybackUpdated", state => completion.TrySetResult(state));
        return completion;
    }
}
