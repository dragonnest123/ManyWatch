using ManyWatch.Domain;
using ManyWatch.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ManyWatch.Features.Rooms.Endpoints;

public static class JoinRoom
{
    public static async Task<IResult> Handle(
        JoinRoomRequest request,
        AppDbContext db,
        CancellationToken cancellationToken)
    {
        var room = await db.Rooms
            .FirstOrDefaultAsync(room => room.Id == request.RoomId, cancellationToken);
        if (room is null)
            return Results.NotFound(new { error = "Room was not found." });

        var alreadyJoined = await db.RoomMembers
            .AnyAsync(x =>
                    x.RoomId == room.Id &&
                    x.UserId == request.UserId,
                cancellationToken);
        if (alreadyJoined)
            return Results.Ok(room.ToResponse());

        room.Members.Add(new RoomMember(request.UserId, room.Id, isHost: false));
        await db.SaveChangesAsync(cancellationToken);

        return Results.Ok(room.ToResponse());
    }
}