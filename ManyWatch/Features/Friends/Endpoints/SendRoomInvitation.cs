using ManyWatch.Domain;
using ManyWatch.Infrastructure.Identity;
using ManyWatch.Infrastructure.Persistence;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace ManyWatch.Features.Friends.Endpoints;

public static class SendRoomInvitation
{
    public static async Task<IResult> Handle(
        InviteFriendRequest request,
        HttpContext context,
        AppDbContext db,
        IHubContext<FriendsHub> hub,
        CancellationToken cancellationToken)
    {
        var userId = context.User.GetAccountUserId();

        if (request.FriendId == userId)
            return Results.BadRequest(new { error = "You cannot invite yourself" });

        var friend = await db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(user => user.Id == request.FriendId, cancellationToken);
        if (friend is null)
            return Results.NotFound(new { error = "User was not found" });

        if (!await FriendQueries.AreFriendsAsync(db, userId, friend.Id, cancellationToken))
            return Results.Json(
                new { error = "You can invite only your friends" },
                statusCode: StatusCodes.Status403Forbidden);

        var room = await db.Rooms
            .AsNoTracking()
            .FirstOrDefaultAsync(room => room.Id == request.RoomId, cancellationToken);
        if (room is null)
            return Results.NotFound(new { error = "Room was not found" });

        var alreadyInvited = await db.RoomInvitations
            .AnyAsync(invitation => invitation.SenderId == userId
                                    && invitation.RecipientId == friend.Id
                                    && invitation.RoomId == room.Id,
                cancellationToken);
        if (alreadyInvited)
            return Results.Conflict(new { error = "Invitation was already sent" });

        var sender = await db.Users
            .AsNoTracking()
            .FirstAsync(user => user.Id == userId, cancellationToken);
        
        var invitation = new RoomInvitation(room.Id, userId, friend.Id);
        db.RoomInvitations.Add(invitation);
        await db.SaveChangesAsync(cancellationToken);

        var response = new RoomInvitationResponse(
            invitation.Id,
            room.Id,
            room.Name,
            sender.Id,
            sender.DisplayName,
            invitation.CreatedAt);

        await FriendsRealtime.NotifyAsync(
            hub,
            friend.Id,
            "RoomInvitationReceived",
            response,
            cancellationToken);

        return Results.Created($"/friends/invitations/{invitation.Id}", response);
    }
}
