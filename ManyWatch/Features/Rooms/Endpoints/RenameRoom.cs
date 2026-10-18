using ManyWatch.Infrastructure.Identity;
using ManyWatch.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ManyWatch.Features.Rooms.Endpoints;

public static class RenameRoom
{
    public static async Task<IResult> Handle(
        Guid id,
        RenameRoomRequest request,
        HttpContext context,
        AppDbContext db,
        CancellationToken cancellationToken)
    {
        var callerId = context.GetAnonymousUserId();

        var room = await db.Rooms
            .Include(room => room.Members)
            .Include(room => room.Bans)
            .Include(room => room.Playback)
            .FirstOrDefaultAsync(room => room.Id == id, cancellationToken);
        if (room is null)
            return Results.NotFound(new { error = "Room was not found" });

        if (room.HostId != callerId)
            return Results.Json(
                new { error = "Only the host can rename the room" },
                statusCode: StatusCodes.Status403Forbidden);

        room.Rename(request.Name);
        await db.SaveChangesAsync(cancellationToken);

        return Results.Ok(room.ToGetRoomResponse(callerId));
    }
}
