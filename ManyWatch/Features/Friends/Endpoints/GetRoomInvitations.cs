using ManyWatch.Infrastructure.Identity;
using ManyWatch.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ManyWatch.Features.Friends.Endpoints;

public static class GetRoomInvitations
{
    public static async Task<IResult> Handle(
        HttpContext context,
        AppDbContext db,
        CancellationToken cancellationToken)
    {
        var userId = context.User.GetAccountUserId();

        var invitations = await db.RoomInvitations
            .AsNoTracking()
            .Include(invitation => invitation.Room)
            .Include(invitation => invitation.Sender)
            .Where(invitation => invitation.RecipientId == userId)
            .OrderByDescending(invitation => invitation.CreatedAt)
            .ToListAsync(cancellationToken);

        return Results.Ok(invitations
            .Select(invitation => invitation.ToRoomInvitationResponse())
            .ToArray());
    }
}
