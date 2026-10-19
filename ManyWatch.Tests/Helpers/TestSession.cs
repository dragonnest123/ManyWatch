using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace ManyWatch.Tests.Helpers;

/// <summary>
/// One simulated browser profile. Owns the anonymous identity cookie issued by
/// <c>AnonymousIdentityMiddleware</c> and reuses it for both REST calls and the
/// SignalR hub connection.
/// </summary>
public sealed class TestSession
{
    private readonly HttpClient _client;

    public TestSession(ManyWatchAppFactory factory)
    {
        _client = new HttpClient(factory.Server.CreateHandler(), disposeHandler: false)
        {
            BaseAddress = factory.Server.BaseAddress,
        };
    }

    /// <summary>Raw <c>manywatch.anon</c> cookie, available after the first request.</summary>
    public string? CookieHeader { get; private set; }

    public async Task EnsureIdentityAsync()
    {
        if (CookieHeader is not null)
        {
            return;
        }

        var response = await GetAsync("/rooms?pageNumber=1&pageSize=1");
        response.EnsureSuccessStatusCode();
    }

    public Task<HttpResponseMessage> GetAsync(string path)
    {
        return SendAsync(HttpMethod.Get, path);
    }

    public async Task<HttpResponseMessage> SendAsync(
        HttpMethod method,
        string path,
        object? body = null,
        string? bearerToken = null)
    {
        using var request = new HttpRequestMessage(method, path);

        if (body is not null)
        {
            request.Content = JsonContent.Create(body);
        }

        if (CookieHeader is not null)
        {
            request.Headers.TryAddWithoutValidation("Cookie", CookieHeader);
        }

        if (bearerToken is not null)
        {
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", bearerToken);
        }

        var response = await _client.SendAsync(request);
        CaptureIdentityCookie(response);
        return response;
    }

    public async Task<T> SendJsonAsync<T>(
        HttpMethod method,
        string path,
        object? body = null,
        string? bearerToken = null)
    {
        var response = await SendAsync(method, path, body, bearerToken);
        response.EnsureSuccessStatusCode();

        var payload = await response.Content.ReadFromJsonAsync<T>();
        return payload!;
    }

    private void CaptureIdentityCookie(HttpResponseMessage response)
    {
        if (!response.Headers.TryGetValues("Set-Cookie", out var values))
        {
            return;
        }

        var identityCookie = values
            .Select(value => value.Split(';', 2)[0])
            .LastOrDefault(value => value.StartsWith("manywatch.anon=", StringComparison.Ordinal));

        if (!string.IsNullOrEmpty(identityCookie))
        {
            CookieHeader = identityCookie;
        }
    }
}
