using ManyWatch.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ManyWatch.Infrastructure.Persistence.EntitiesConfiguration;

public class RoomConfiguration : IEntityTypeConfiguration<Room>
{
    public void Configure(EntityTypeBuilder<Room> builder)
    {
        builder.HasKey(room => room.Id);

        builder.Property(room => room.Name)
            .IsRequired()
            .HasMaxLength(128);

        builder.Property(room => room.CreatedAt)
            .IsRequired();

        builder.HasMany(room => room.Members)
            .WithOne(member => member.Room)
            .HasForeignKey(member => member.RoomId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}