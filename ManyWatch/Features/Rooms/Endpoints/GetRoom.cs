using ManyWatch.Infrastructure.Identity;
using ManyWatch.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ManyWatch.Features.Rooms.Endpoints;

public static class GetRoom
{
    public static async Task<IResult> Handle(
        Guid id,
        HttpContext context,
        AppDbContext db,
        CancellationToken cancellationToken)
    {
        var viewerId = context.GetAnonymousUserId();

        var room = await db.Rooms
            .AsNoTracking()
            .Include(room => room.Members)
            .Include(room => room.Bans)
            .Include(room => room.Playback)
            .FirstOrDefaultAsync(room => room.Id == id, cancellationToken);

        return room is null
            ? Results.NotFound(new { error = "Room was not found." })
            : Results.Ok(room.ToGetRoomResponse(viewerId));
    }
}
