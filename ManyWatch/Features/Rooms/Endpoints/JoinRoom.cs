using ManyWatch.Domain;
using ManyWatch.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ManyWatch.Features.Rooms.Endpoints;

public static class JoinRoom
{
    public static async Task<IResult> Handle(
        Guid id,
        Guid userId,
        AppDbContext db,
        CancellationToken cancellationToken)
    {
        var room = await db.Rooms
            .Include(room => room.Members)
            .FirstOrDefaultAsync(room => room.Id == id, cancellationToken);
        if (room is null)
            return Results.NotFound(new { error = "Room was not found." });

        var alreadyJoined = await db.RoomMembers
            .AnyAsync(x =>
                    x.RoomId == room.Id &&
                    x.UserId == userId,
                cancellationToken);
        if (alreadyJoined)
            return Results.Ok(room.ToGetRoomResponse());

        if (room.IsPrivate)
            return Results.Ok(new { error = "This is a private room. Use the link to join it" });

        room.Members.Add(new RoomMember(userId, room.Id, isHost: false));
        await db.SaveChangesAsync(cancellationToken);

        return Results.Ok(room.ToGetRoomResponse());
    }
}
