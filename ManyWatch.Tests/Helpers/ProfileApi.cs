using System.Net.Http.Json;

namespace ManyWatch.Tests.Helpers;

/// <summary>Typed wrappers over the profile REST API.</summary>
public static class ProfileApi
{
    public static Task<ProfileDto> GetAsync(TestSession session, AuthDto auth)
    {
        return session.SendJsonAsync<ProfileDto>(
            HttpMethod.Get,
            "/profile",
            bearerToken: auth.AccessToken);
    }

    public static Task<HttpResponseMessage> UpdateAsync(
        TestSession session,
        AuthDto auth,
        string displayName,
        string? bio)
    {
        return session.SendAsync(
            HttpMethod.Put,
            "/profile",
            new { displayName, bio },
            bearerToken: auth.AccessToken);
    }

    public static Task<HttpResponseMessage> UploadAvatarAsync(
        TestSession session,
        AuthDto auth,
        string dataUrl)
    {
        return session.SendAsync(
            HttpMethod.Put,
            "/profile/avatar",
            new { dataUrl },
            bearerToken: auth.AccessToken);
    }

    public static Task<HttpResponseMessage> DeleteAvatarAsync(TestSession session, AuthDto auth)
    {
        return session.SendAsync(
            HttpMethod.Delete,
            "/profile/avatar",
            bearerToken: auth.AccessToken);
    }

    public static Task<HttpResponseMessage> RecordWatchTimeAsync(
        TestSession session,
        AuthDto auth,
        long seconds)
    {
        return session.SendAsync(
            HttpMethod.Post,
            "/profile/watch-time",
            new { seconds },
            bearerToken: auth.AccessToken);
    }

    public static async Task<ProfileDto> ReadProfileAsync(HttpResponseMessage response)
    {
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<ProfileDto>())!;
    }
}
