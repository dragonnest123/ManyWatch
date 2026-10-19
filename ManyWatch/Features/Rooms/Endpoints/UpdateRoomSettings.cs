using ManyWatch.Infrastructure.Identity;
using ManyWatch.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ManyWatch.Features.Rooms.Endpoints;

public static class UpdateRoomSettings
{
    public static async Task<IResult> Handle(
        Guid id,
        UpdateRoomSettingsRequest request,
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
                new { error = "Only the host can change room settings" },
                statusCode: StatusCodes.Status403Forbidden);

        if (request.MaxMembers is { } maxMembers && maxMembers < room.Members.Count)
        {
            return Results.BadRequest(new
            {
                error = $"Max participants cannot be less than the current number of members ({room.Members.Count})"
            });
        }

        room.Settings.Update(request.IsPrivate, request.MaxMembers, request.JoinPolicy);
        await db.SaveChangesAsync(cancellationToken);

        return Results.Ok(room.ToGetRoomResponse(callerId));
    }
}
