using ManyWatch.Infrastructure.EndpointFilters;

namespace ManyWatch.Features.Friends.Endpoints;

public static class FriendsEndpoints
{
    extension(WebApplication app)
    {
        public WebApplication MapFriendsEndpoints()
        {
            var friends = app.MapGroup("/friends")
                .RequireAuthorization()
                .WithTags("Friends");

            friends.MapGet("/", GetFriends.Handle)
                .WithTags("GetFriends");

            friends.MapGet("/search", SearchUsers.Handle)
                .WithTags("SearchUsers");

            friends.MapGet("/requests", GetFriendRequests.Handle)
                .WithTags("GetFriendRequests");

            friends.MapPost("/requests", SendFriendRequest.Handle)
                .AddEndpointFilter<ValidationFilter<AddFriendRequest>>()
                .WithTags("SendFriendRequest");

            friends.MapPost("/requests/{id:guid}/accept", AcceptFriendRequest.Handle)
                .WithTags("AcceptFriendRequest");

            friends.MapDelete("/requests/{id:guid}", DeleteFriendRequest.Handle)
                .WithTags("DeleteFriendRequest");

            friends.MapDelete("/{friendId:guid}", RemoveFriend.Handle)
                .WithTags("RemoveFriend");

            friends.MapGet("/invitations", GetRoomInvitations.Handle)
                .WithTags("GetRoomInvitations");

            friends.MapPost("/invitations", SendRoomInvitation.Handle)
                .AddEndpointFilter<ValidationFilter<InviteFriendRequest>>()
                .WithTags("SendRoomInvitation");

            friends.MapPost("/invitations/{id:guid}/accept", AcceptRoomInvitation.Handle)
                .WithTags("AcceptRoomInvitation");

            friends.MapDelete("/invitations/{id:guid}", DeleteRoomInvitation.Handle)
                .WithTags("DeleteRoomInvitation");

            return app;
        }
    }
}
