using System.Text.RegularExpressions;

namespace ManyWatch.Domain;

public static partial class UsernameRules
{
    public const int MinLength = 3;
    public const int MaxLength = 32;

    public static string Normalize(string? username)
    {
        return (username ?? string.Empty).Trim().ToLowerInvariant();
    }

    public static bool IsValid(string? username)
    {
        return UsernamePattern().IsMatch(Normalize(username));
    }

    [GeneratedRegex("^[a-z][a-z0-9_]{2,31}$")]
    private static partial Regex UsernamePattern();
}
