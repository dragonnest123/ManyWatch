using ManyWatch.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ManyWatch.Infrastructure.Persistence.EntitiesConfiguration;

public class RoomPlaybackConfiguration : IEntityTypeConfiguration<RoomPlayback>
{
    public void Configure(EntityTypeBuilder<RoomPlayback> builder)
    {
        builder.HasKey(playback => playback.RoomId);

        builder.Property(playback => playback.VideoUrl)
            .HasMaxLength(2048);

        builder.Property(playback => playback.IsPlaying)
            .IsRequired();

        builder.Property(playback => playback.UpdatedAt)
            .IsRequired();

        builder.Property(playback => playback.UpdatedByUserId)
            .IsRequired();

        builder.HasOne(playback => playback.Room)
            .WithOne(room => room.Playback)
            .HasForeignKey<RoomPlayback>(playback => playback.RoomId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
