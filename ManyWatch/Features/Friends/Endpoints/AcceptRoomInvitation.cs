using ManyWatch.Infrastructure.Identity;
using ManyWatch.Infrastructure.Persistence;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace ManyWatch.Features.Friends.Endpoints;

public static class AcceptRoomInvitation
{
    public static async Task<IResult> Handle(
        Guid id,
        HttpContext context,
        AppDbContext db,
        IHubContext<FriendsHub> hub,
        CancellationToken cancellationToken)
    {
        var userId = context.User.GetAccountUserId();

        var invitation = await db.RoomInvitations
            .Include(invitation => invitation.Room)
            .FirstOrDefaultAsync(invitation => invitation.Id == id, cancellationToken);
        if (invitation is null)
            return Results.NotFound(new { error = "Invitation was not found" });

        if (invitation.RecipientId != userId)
            return Results.Json(
                new { error = "Invitation was sent to another user" },
                statusCode: StatusCodes.Status403Forbidden);

        if (invitation.Room is null)
            return Results.NotFound(new { error = "Room was not found" });

        if (!await FriendQueries.AreFriendsAsync(db, userId, invitation.SenderId, cancellationToken))
            return Results.Json(
                new { error = "You can accept invitations only from your friends" },
                statusCode: StatusCodes.Status403Forbidden);

        var roomId = invitation.RoomId;

        db.RoomInvitations.Remove(invitation);
        await db.SaveChangesAsync(cancellationToken);

        await FriendsRealtime.NotifyAsync(
            hub,
            invitation.SenderId,
            "RoomInvitationAccepted",
            new { invitationId = invitation.Id, recipientId = userId, roomId },
            cancellationToken);

        return Results.Ok(new AcceptRoomInvitationResponse(roomId));
    }
}
