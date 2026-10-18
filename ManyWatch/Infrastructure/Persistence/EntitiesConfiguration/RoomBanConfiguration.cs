using ManyWatch.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ManyWatch.Infrastructure.Persistence.EntitiesConfiguration;

public class RoomBanConfiguration : IEntityTypeConfiguration<RoomBan>
{
    public void Configure(EntityTypeBuilder<RoomBan> builder)
    {
        builder.HasKey(ban => new
        {
            ban.RoomId,
            ban.UserId
        });

        builder.Property(ban => ban.BannedAt)
            .IsRequired();

        builder.HasIndex(ban => ban.UserId);

        builder.HasOne(ban => ban.Room)
            .WithMany(room => room.Bans)
            .HasForeignKey(ban => ban.RoomId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
