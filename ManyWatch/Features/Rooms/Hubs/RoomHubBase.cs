using ManyWatch.Infrastructure.Identity;
using ManyWatch.Infrastructure.Persistence;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace ManyWatch.Features.Rooms.Hubs;

public abstract class RoomHubBase : Hub
{
    protected RoomHubBase(AppDbContext db)
    {
        Db = db;
    }

    protected AppDbContext Db { get; }

    protected Guid GetUserId()
    {
        var httpContext = Context.GetHttpContext()
            ?? throw new HubException("Anonymous identity is not available for this connection");

        return httpContext.GetAnonymousUserId();
    }

    protected async Task EnsureMembership(Guid roomId, Guid userId)
    {
        var isMember = await Db.RoomMembers
            .AnyAsync(member => member.RoomId == roomId && member.UserId == userId);

        if (!isMember)
            throw new HubException("You are not a member of this room");
    }
    
    protected async Task JoinRoomGroupAsync(Guid roomId)
    {
        var userId = GetUserId();
        await EnsureMembership(roomId, userId);
        await Groups.AddToGroupAsync(Context.ConnectionId, GroupName(roomId));
    }

    protected Task LeaveRoomGroupAsync(Guid roomId)
    {
        return Groups.RemoveFromGroupAsync(Context.ConnectionId, GroupName(roomId));
    }

    protected static string GroupName(Guid roomId)
    {
        return $"room-{roomId:N}";
    }
}
