using ManyWatch.Common.Pagination;
using ManyWatch.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ManyWatch.Features.Rooms.Endpoints;

public class GetRooms
{
    public static async Task<IResult> Handle(
        [AsParameters] RoomsFilterParameters filterParams,
        [AsParameters] PageInfo pageInfo,
        AppDbContext db,
        CancellationToken cancellationToken)
    {
        var roomPage = await db.Rooms
            .AsNoTracking()
            .Filter(filterParams)
            .OrderByDescending(room => room.CreatedAt)                                                                                                                                                            
            .Select(room => new RoomItemResponse(room.Id, room.Name, room.IsPrivate, room.Members.Count))
            .ToPagedResultAsync(pageInfo, cancellationToken);
        
        return Results.Ok(roomPage);
    }
}