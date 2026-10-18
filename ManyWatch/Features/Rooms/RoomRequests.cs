namespace ManyWatch.Features.Rooms;

public sealed record CreateRoomRequest(
    string Name,
    bool IsPrivate = false);

public sealed record UpdatePlaybackRequest(
    string? VideoUrl,
    bool IsPlaying,
    double PositionSeconds,
    double DurationSeconds);
