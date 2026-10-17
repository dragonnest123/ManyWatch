using ManyWatch.Domain;
using ManyWatch.Infrastructure.Identity;
using ManyWatch.Infrastructure.Persistence;

namespace ManyWatch.Features.Rooms.Endpoints;

public static class CreateRoom
{
    public static async Task<IResult> Handle(
        CreateRoomRequest request,
        HttpContext context,
        AppDbContext db,
        CancellationToken cancellationToken)
    {
        var hostId = context.GetAnonymousUserId();

        var room = new Room(hostId, request.Name, request.IsPrivate);

        room.Members.Add(new RoomMember(hostId, room.Id, isHost: true));
        db.Rooms.Add(room);
        await db.SaveChangesAsync(cancellationToken);

        return Results.Created($"/rooms/{room.Id}", room.ToGetRoomResponse(hostId));
    }
}
