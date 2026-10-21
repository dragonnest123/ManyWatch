using ManyWatch.Domain;

namespace ManyWatch.Features.Friends;

public static class FriendsMapping
{
    extension(Friendship friendship)
    {
        public FriendResponse ToFriendResponse(User friend)
        {
            return new FriendResponse(
                friend.Id,
                friend.DisplayName,
                friend.Email,
                friendship.RespondedAt ?? friendship.CreatedAt);
        }

        public FriendRequestResponse ToFriendRequestResponse(User otherUser)
        {
            return new FriendRequestResponse(
                friendship.Id,
                otherUser.Id,
                otherUser.DisplayName,
                otherUser.Email,
                friendship.CreatedAt);
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
