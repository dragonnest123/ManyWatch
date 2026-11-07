using ManyWatch.Domain;
using ManyWatch.Features.Profile;

namespace ManyWatch.Features.Friends;

public static class FriendsMapping
{
    extension(Friendship friendship)
    {
        public FriendResponse ToFriendResponse(User friend, bool isOnline)
        {
            return new FriendResponse(
                friend.Id,
                friend.Username,
                friend.DisplayName,
                friendship.RespondedAt ?? friendship.CreatedAt,
                ProfileMapping.AvatarUrl(friend),
                isOnline);
        }

        public FriendRequestResponse ToFriendRequestResponse(User otherUser)
        {
            return new FriendRequestResponse(
                friendship.Id,
                otherUser.Id,
                otherUser.Username,
                otherUser.DisplayName,
                friendship.CreatedAt,
                ProfileMapping.AvatarUrl(otherUser));
        }
    }

    extension(RoomInvitation invitation)
    {
        public RoomInvitationResponse ToRoomInvitationResponse()
        {
            return new RoomInvitationResponse(
                invitation.Id,
                invitation.RoomId,
                invitation.Room?.Name ?? string.Empty,
                invitation.SenderId,
                invitation.Sender?.DisplayName ?? string.Empty,
                invitation.CreatedAt);
        }
    }

    extension(DirectMessage message)
    {
        public DirectMessageResponse ToDirectMessageResponse()
        {
            return new DirectMessageResponse(
                message.Id,
                message.SenderId,
                message.RecipientId,
                message.Content,
                message.SentAt);
        }
    }
}
