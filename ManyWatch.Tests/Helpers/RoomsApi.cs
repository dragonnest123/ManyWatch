using System.Net;
using System.Net.Http.Json;

namespace ManyWatch.Tests.Helpers;

/// <summary>Thin typed wrappers over the rooms REST API.</summary>
public static class RoomsApi
{
    public static async Task<RoomDto> CreateAsync(
        TestSession session,
        string name,
        bool isPrivate = false)
    {
        var response = await session.SendAsync(HttpMethod.Post, "/rooms/create", new { name, isPrivate });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        return (await response.Content.ReadFromJsonAsync<RoomDto>())!;
    }

    public static async Task<RoomDto?> TryGetAsync(TestSession session, Guid roomId)
    {
        var response = await session.GetAsync($"/rooms/{roomId}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        return await response.Content.ReadFromJsonAsync<RoomDto>();
    }

    public static async Task<RoomDto> JoinAsync(TestSession session, Guid roomId, string? bearerToken = null)
    {
        var response = await session.SendAsync(HttpMethod.Post, $"/rooms/{roomId}/join", bearerToken: bearerToken);
        response.EnsureSuccessStatusCode();

        return (await response.Content.ReadFromJsonAsync<RoomDto>())!;
    }

    public static Task<HttpResponseMessage> TryJoinAsync(
        TestSession session,
        Guid roomId,
        string? bearerToken = null)
    {
        return session.SendAsync(HttpMethod.Post, $"/rooms/{roomId}/join", bearerToken: bearerToken);
    }

    public static Task<HttpResponseMessage> LeaveAsync(TestSession session, Guid roomId)
    {
        return session.SendAsync(HttpMethod.Post, $"/rooms/{roomId}/leave");
    }

    public static Task<HttpResponseMessage> BanAsync(TestSession session, Guid roomId, Guid userId)
    {
        return session.SendAsync(HttpMethod.Post, $"/rooms/{roomId}/members/{userId}/ban");
    }

    public static Task<HttpResponseMessage> UnbanAsync(TestSession session, Guid roomId, Guid userId)
    {
        return session.SendAsync(HttpMethod.Delete, $"/rooms/{roomId}/members/{userId}/ban");
    }

    public static Task<HttpResponseMessage> UpdateSettingsAsync(
        TestSession session,
        Guid roomId,
        bool isPrivate,
        int? maxMembers,
        string joinPolicy)
    {
        return session.SendAsync(
            HttpMethod.Put,
            $"/rooms/{roomId}/settings",
            new { isPrivate, maxMembers, joinPolicy });
    }

    public static Task<HttpResponseMessage> RenameAsync(TestSession session, Guid roomId, string name)
    {
        return session.SendAsync(HttpMethod.Put, $"/rooms/{roomId}/name", new { name });
    }

    public static Task<HttpResponseMessage> DeleteAsync(TestSession session, Guid roomId)
    {
        return session.SendAsync(HttpMethod.Delete, $"/rooms/{roomId}");
    }

    public static RoomMemberDto Me(RoomDto room)
    {
        return room.Members.Single(member => member.IsMe);
    }
}
