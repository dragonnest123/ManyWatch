using ManyWatch.Domain;

namespace ManyWatch.Features.Rooms;

public sealed record CreateRoomRequest(
    string Name,
    bool IsPrivate = false);

public sealed record UpdateRoomSettingsRequest(
    bool IsPrivate,
    int? MaxMembers,
    RoomJoinPolicy JoinPolicy);

public sealed record RenameRoomRequest(
    string Name);

public sealed record UpdatePlaybackRequest(
    string? VideoUrl,
    bool IsPlaying,
    double PositionSeconds,
    double DurationSeconds);
