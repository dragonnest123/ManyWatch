using ManyWatch.Domain;
using ManyWatch.Infrastructure.Persistence;

namespace ManyWatch.Features.Rooms.Endpoints;

public static class CreateRoom
{
    public static async Task<IResult> Handle(
        CreateRoomRequest request,
        AppDbContext db,
        CancellationToken cancellationToken)
    {
        var room = new Room(request.HostId, request.Name, request.IsPrivate);
        
        room.Members.Add(new RoomMember(request.HostId, room.Id, isHost: true));
        db.Rooms.Add(room);
        await db.SaveChangesAsync(cancellationToken);

        return Results.Created($"/rooms/{room.Id}", room.ToResponse());
    }
}