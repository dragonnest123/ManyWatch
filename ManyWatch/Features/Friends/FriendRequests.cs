namespace ManyWatch.Features.Friends;

public sealed record AddFriendRequest(
    Guid UserId);

public sealed record InviteFriendRequest(
    Guid FriendId,
    Guid RoomId);

public sealed record SendDirectMessageRequest(
    string? Content);
