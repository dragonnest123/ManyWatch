using ManyWatch.Domain;
using Microsoft.EntityFrameworkCore;

namespace ManyWatch.Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    public DbSet<Room> Rooms => Set<Room>();
    public DbSet<RoomMember> RoomMembers => Set<RoomMember>();
    public DbSet<RoomBan> RoomBans => Set<RoomBan>();
    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}