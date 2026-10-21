using System.Net;
using System.Net.Http.Json;

namespace ManyWatch.Tests.Helpers;

/// <summary>Typed wrappers over the friends REST API.</summary>
public static class FriendsApi
{
    public static async Task<(AuthDto Auth, TestSession Session)> RegisterAsync(
        ManyWatchAppFactory factory,
        string displayName)
    {
        var session = new TestSession(factory);
        await session.EnsureIdentityAsync();

        var email = $"{Guid.NewGuid():N}@example.com";
        var auth = await session.SendJsonAsync<AuthDto>(
            HttpMethod.Post,
            "/auth/register",
            new
            {
                email,
                password = "password123",
                displayName = $"{displayName} {Guid.NewGuid():N}",
            });

        return (auth, session);
    }

    public static Task<HttpResponseMessage> SendRequestAsync(
        TestSession session,
        AuthDto auth,
        Guid userId)
    {
        return session.SendAsync(
            HttpMethod.Post,
            "/friends/requests",
            new { userId },
            bearerToken: auth.AccessToken);
    }

    public static Task<HttpResponseMessage> AcceptRequestAsync(
        TestSession session,
        AuthDto auth,
        Guid requestId)
    {
        return session.SendAsync(
            HttpMethod.Post,
            $"/friends/requests/{requestId}/accept",
            bearerToken: auth.AccessToken);
    }

    public static Task<HttpResponseMessage> DeleteRequestAsync(
        TestSession session,
        AuthDto auth,
        Guid requestId)
    {
        return session.SendAsync(
            HttpMethod.Delete,
            $"/friends/requests/{requestId}",
            bearerToken: auth.AccessToken);
    }

    public static Task<HttpResponseMessage> RemoveFriendAsync(
        TestSession session,
        AuthDto auth,
        Guid friendId)
    {
        return session.SendAsync(
            HttpMethod.Delete,
            $"/friends/{friendId}",
            bearerToken: auth.AccessToken);
    }

    public static Task<FriendRequestsDto> GetRequestsAsync(
        TestSession session,
        AuthDto auth)
    {
        return session.SendJsonAsync<FriendRequestsDto>(
            HttpMethod.Get,
            "/friends/requests",
            bearerToken: auth.AccessToken);
    }

    public static Task<List<FriendDto>> GetFriendsAsync(
        TestSession session,
        AuthDto auth)
    {
        return session.SendJsonAsync<List<FriendDto>>(
            HttpMethod.Get,
            "/friends",
            bearerToken: auth.AccessToken);
    }

    public static Task<List<UserSearchResultDto>> SearchAsync(
        TestSession session,
        AuthDto auth,
        string query)
    {
        return session.SendJsonAsync<List<UserSearchResultDto>>(
            HttpMethod.Get,
            $"/friends/search?query={Uri.EscapeDataString(query)}",
            bearerToken: auth.AccessToken);
    }

    public static Task<HttpResponseMessage> InviteAsync(
        TestSession session,
        AuthDto auth,
        Guid friendId,
        Guid roomId)
    {
        return session.SendAsync(
            HttpMethod.Post,
            "/friends/invitations",
            new { friendId, roomId },
            bearerToken: auth.AccessToken);
    }

    public static Task<List<RoomInvitationDto>> GetInvitationsAsync(
        TestSession session,
        AuthDto auth)
    {
        return session.SendJsonAsync<List<RoomInvitationDto>>(
            HttpMethod.Get,
            "/friends/invitations",
            bearerToken: auth.AccessToken);
    }

    public static Task<HttpResponseMessage> AcceptInvitationAsync(
        TestSession session,
        AuthDto auth,
        Guid invitationId)
    {
        return session.SendAsync(
            HttpMethod.Post,
            $"/friends/invitations/{invitationId}/accept",
            bearerToken: auth.AccessToken);
    }

    public static async Task MakeFriendsAsync(
        TestSession firstSession,
        AuthDto first,
        TestSession secondSession,
        AuthDto second)
    {
        var response = await SendRequestAsync(firstSession, first, second.UserId);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var requests = await GetRequestsAsync(secondSession, second);
        var incoming = Assert.Single(requests.Incoming);

        response = await AcceptRequestAsync(secondSession, second, incoming.Id);
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    public static async Task<RoomInvitationDto> InviteToRoomAsync(
        TestSession session,
        AuthDto auth,
        Guid friendId,
        Guid roomId)
    {
        var response = await InviteAsync(session, auth, friendId, roomId);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        return (await response.Content.ReadFromJsonAsync<RoomInvitationDto>())!;
    }
}
