namespace ManyWatch.Features.Friends;

public enum FriendRelationship
{
    None,
    Friends,
    OutgoingRequest,
    IncomingRequest
}

public sealed record FriendResponse(
    Guid UserId,
    string DisplayName,
    string Email,
    DateTime FriendsSince);

public sealed record FriendRequestResponse(
    Guid Id,
    Guid UserId,
    string DisplayName,
    string Email,
    DateTime CreatedAt);

public sealed record FriendRequestsResponse(
    IReadOnlyCollection<FriendRequestResponse> Incoming,
    IReadOnlyCollection<FriendRequestResponse> Outgoing);

public sealed record UserSearchResultResponse(
    Guid UserId,
    string DisplayName,
    string Email,
    FriendRelationship Relationship);

public sealed record RoomInvitationResponse(
    Guid Id,
    Guid RoomId,
    string RoomName,
    Guid SenderId,
    string SenderDisplayName,
    DateTime CreatedAt);

public sealed record AcceptRoomInvitationResponse(
    Guid RoomId);

public sealed record DirectMessageResponse(
    Guid Id,
    Guid SenderId,
    Guid RecipientId,
    string Content,
    DateTime SentAtUtc);
