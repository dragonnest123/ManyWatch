using ManyWatch.Infrastructure.Configuration;
using ManyWatch.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace ManyWatch.Infrastructure.BackgroundServices;

public class StaleRoomMemberCleanupService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IOptions<RoomPresenceOptions> _options;

    public StaleRoomMemberCleanupService(
        IServiceScopeFactory scopeFactory,
        IOptions<RoomPresenceOptions> options)
    {
        _scopeFactory = scopeFactory;
        _options = options;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(_options.Value.CleanupInterval);

        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            await CleanupAsync(stoppingToken);
        }
    }

    private async Task CleanupAsync(CancellationToken cancellationToken)
    {
        var cutoff = DateTime.UtcNow - _options.Value.MemberTimeout;

        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var roomIds = await db.RoomMembers
            .Where(member => member.LastSeenAt < cutoff)
            .Select(member => member.RoomId)
            .Distinct()
            .ToListAsync(cancellationToken);

        foreach (var roomId in roomIds)
        {
            var room = await db.Rooms
                .Include(x => x.Members)
                .FirstOrDefaultAsync(x => x.Id == roomId, cancellationToken);

            if (room is null)
                continue;

            var staleMembers = room.Members
                .Where(x => x.LastSeenAt < cutoff)
                .ToList();

            foreach (var member in staleMembers)
                room.RemoveMember(member);

            if (room.Members.Count == 0)
                db.Rooms.Remove(room);
        }

        await db.SaveChangesAsync(cancellationToken);
    }
}