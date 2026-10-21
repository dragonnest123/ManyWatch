using ManyWatch.Infrastructure.Identity;
using ManyWatch.Infrastructure.Persistence;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace ManyWatch.Features.Friends.Endpoints;

public static class DeleteRoomInvitation
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
            .FirstOrDefaultAsync(invitation => invitation.Id == id, cancellationToken);
        if (invitation is null)
            return Results.NotFound(new { error = "Invitation was not found" });

        if (invitation.SenderId != userId && invitation.RecipientId != userId)
            return Results.NotFound(new { error = "Invitation was not found" });

        var otherUserId = invitation.SenderId == userId
            ? invitation.RecipientId
            : invitation.SenderId;

        db.RoomInvitations.Remove(invitation);
        await db.SaveChangesAsync(cancellationToken);

        await FriendsRealtime.NotifyAsync(
            hub,
            otherUserId,
            "RoomInvitationRemoved",
            new { invitationId = invitation.Id },
            cancellationToken);

        return Results.NoContent();
    }
}
