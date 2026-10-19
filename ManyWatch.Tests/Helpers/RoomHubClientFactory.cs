using Microsoft.AspNetCore.Http.Connections;
using Microsoft.AspNetCore.SignalR.Client;

namespace ManyWatch.Tests.Helpers;

public static class RoomHubClientFactory
{
    /// <summary>
    /// Creates a SignalR client bound to the in-process TestServer. Long polling
    /// is used because TestServer does not support WebSockets.
    /// </summary>
    public static HubConnection Create(ManyWatchAppFactory factory, TestSession session)
    {
        Assert.False(string.IsNullOrEmpty(session.CookieHeader), "Call EnsureIdentityAsync before connecting to the hub");

        return new HubConnectionBuilder()
            .WithUrl(new Uri(factory.Server.BaseAddress, "hubs/rooms"), options =>
            {
                options.HttpMessageHandlerFactory = _ => factory.Server.CreateHandler();
                options.Transports = HttpTransportType.LongPolling;
                options.Headers["Cookie"] = session.CookieHeader!;
            })
            .Build();
    }
}
