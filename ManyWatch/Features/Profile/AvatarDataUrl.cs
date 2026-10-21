using System.Buffers.Text;

namespace ManyWatch.Features.Profile;

public static class AvatarDataUrl
{
    private const int MaxBytes = 512 * 1024;
    private const int MaxDataUrlLength = 720_000;

    private const string PngPrefix = "data:image/png;base64,";
    private const string JpegPrefix = "data:image/jpeg;base64,";
    private const string WebpPrefix = "data:image/webp;base64,";

    private static ReadOnlySpan<byte> PngSignature => [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];

    public static bool IsValid(string? value)
    {
        return TryParse(value, out _, out _);
    }

    public static bool TryParse(string? value, out byte[] data, out string contentType)
    {
        data = [];
        contentType = string.Empty;

        if (string.IsNullOrWhiteSpace(value) || value.Length > MaxDataUrlLength)
            return false;

        var prefix = GetPrefix(value);
        if (prefix is null)
            return false;

        var payload = value[prefix.Value.Prefix.Length..];

        if (payload.Length == 0 || payload.Length > Base64.GetMaxEncodedToUtf8Length(MaxBytes))
            return false;

        try
        {
            data = Convert.FromBase64String(payload);
        }
        catch (FormatException)
        {
            return false;
        }

        if (data.Length == 0 || data.Length > MaxBytes)
            return false;

        contentType = prefix.Value.ContentType;

        return HasExpectedSignature(data, contentType);
    }

    private static (string Prefix, string ContentType)? GetPrefix(string value)
    {
        if (value.StartsWith(PngPrefix, StringComparison.OrdinalIgnoreCase))
            return (PngPrefix, "image/png");

        if (value.StartsWith(JpegPrefix, StringComparison.OrdinalIgnoreCase))
            return (JpegPrefix, "image/jpeg");

        if (value.StartsWith(WebpPrefix, StringComparison.OrdinalIgnoreCase))
            return (WebpPrefix, "image/webp");

        return null;
    }

    private static bool HasExpectedSignature(ReadOnlySpan<byte> data, string contentType)
    {
        return contentType switch
        {
            "image/png" => data.Length >= PngSignature.Length
                           && data[..PngSignature.Length].SequenceEqual(PngSignature),
            "image/jpeg" => data.Length >= 3
                            && data[0] == 0xFF
                            && data[1] == 0xD8
                            && data[2] == 0xFF,
            "image/webp" => data.Length >= 12
                            && data[..4].SequenceEqual("RIFF"u8)
                            && data.Slice(8, 4).SequenceEqual("WEBP"u8),
            _ => false
        };
    }
}
