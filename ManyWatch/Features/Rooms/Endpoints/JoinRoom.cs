using ManyWatch.Domain;
using ManyWatch.Infrastructure.Identity;
using ManyWatch.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ManyWatch.Features.Rooms.Endpoints;

public static class JoinRoom
{
    public static async Task<IResult> Handle(
        Guid id,
        HttpContext context,
        AppDbContext db,
        CancellationToken cancellationToken)
    {
        var userId = context.GetAnonymousUserId();

        var room = await db.Rooms
            .Include(room => room.Members)
            .Include(room => room.Bans)
            .FirstOrDefaultAsync(room => room.Id == id, cancellationToken);
        if (room is null)
            return Results.NotFound(new { error = "Room was not found." });

        var isBanned = room.Bans.Any(ban => ban.UserId == userId);
        if (isBanned)
            return Results.Json(
                new { error = "You are banned from this room." },
                statusCode: StatusCodes.Status403Forbidden);

        var alreadyJoined = room.Members.Any(member => member.UserId == userId);
        if (alreadyJoined)
            return Results.Ok(room.ToGetRoomResponse(userId));

        if (room.IsPrivate)
            return Results.Json(
                new { error = "This is a private room. Use the link to join it." },
                statusCode: StatusCodes.Status403Forbidden);

        room.Members.Add(new RoomMember(userId, room.Id, isHost: false));
        await db.SaveChangesAsync(cancellationToken);

        return Results.Ok(room.ToGetRoomResponse(userId));
    }
}
