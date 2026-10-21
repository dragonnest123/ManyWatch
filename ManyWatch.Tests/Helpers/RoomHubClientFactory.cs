using Microsoft.AspNetCore.Http.Connections;
using Microsoft.AspNetCore.SignalR.Client;

namespace ManyWatch.Tests.Helpers;

public static class RoomHubClientFactory
{
    public const string PlaybackHubPath = "hubs/rooms/playback";
    public const string ChatHubPath = "hubs/rooms/chat";
    public const string FriendsHubPath = "hubs/friends";

    /// <summary>
    /// Creates a SignalR client bound to the in-process TestServer. Long polling
    /// is used because TestServer does not support WebSockets.
    /// </summary>
    public static HubConnection Create(
        ManyWatchAppFactory factory,
        TestSession session,
        string hubPath,
        string? accessToken = null)
    {
        Assert.False(string.IsNullOrEmpty(session.CookieHeader), "Call EnsureIdentityAsync before connecting to the hub");

        return new HubConnectionBuilder()
            .WithUrl(new Uri(factory.Server.BaseAddress, hubPath), options =>
            {
                options.HttpMessageHandlerFactory = _ => factory.Server.CreateHandler();
                options.Transports = HttpTransportType.LongPolling;
                options.Headers["Cookie"] = session.CookieHeader!;

                if (accessToken is not null)
                    options.AccessTokenProvider = () => Task.FromResult<string?>(accessToken);
            })
            .Build();
    }
}
