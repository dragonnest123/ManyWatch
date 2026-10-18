using ManyWatch.Domain;
using ManyWatch.Infrastructure.Identity;
using ManyWatch.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ManyWatch.Features.Rooms.Endpoints;

public static class BanMember
{
    public static async Task<IResult> Handle(
        Guid id,
        Guid userId,
        HttpContext context,
        AppDbContext db,
        CancellationToken cancellationToken)
    {
        var callerId = context.GetAnonymousUserId();

        var room = await db.Rooms
            .Include(room => room.Members)
            .FirstOrDefaultAsync(room => room.Id == id, cancellationToken);
        if (room is null)
            return Results.NotFound(new { error = "Room was not found." });

        if (room.HostId != callerId)
            return Results.Json(new { error = "Only the host can ban members." }, statusCode: StatusCodes.Status403Forbidden);

        if (userId == callerId)
            return Results.BadRequest(new { error = "The host cannot ban themselves." });

        var member = room.Members.FirstOrDefault(member => member.UserId == userId);
        if (member is not null)
            room.RemoveMember(member);

        var alreadyBanned = await db.RoomBans
            .AnyAsync(ban => ban.RoomId == id && ban.UserId == userId, cancellationToken);

        if (!alreadyBanned)
            db.RoomBans.Add(new RoomBan(id, userId));

        await db.SaveChangesAsync(cancellationToken);

        return Results.NoContent();
    }
}
