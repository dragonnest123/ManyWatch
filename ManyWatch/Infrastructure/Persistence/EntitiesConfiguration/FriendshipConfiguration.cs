using ManyWatch.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ManyWatch.Infrastructure.Persistence.EntitiesConfiguration;

public class FriendshipConfiguration : IEntityTypeConfiguration<Friendship>
{
    public void Configure(EntityTypeBuilder<Friendship> builder)
    {
        builder.HasKey(friendship => friendship.Id);

        builder.Property(friendship => friendship.Status)
            .HasConversion<string>()
            .HasMaxLength(32)
            .IsRequired();

        builder.Property(friendship => friendship.CreatedAt)
            .IsRequired();

        builder.HasIndex(friendship => new
        {
            friendship.UserLowId,
            friendship.UserHighId
        }).IsUnique();

        builder.HasIndex(friendship => friendship.UserHighId);

        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(friendship => friendship.UserLowId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(friendship => friendship.UserHighId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
