namespace ManyWatch.Features.Profile;

public sealed record UpdateProfileRequest(
    string Username,
    string DisplayName,
    string? Bio);

public sealed record UpdateAvatarRequest(
    string DataUrl);

public sealed record RecordWatchTimeRequest(
    long Seconds);
