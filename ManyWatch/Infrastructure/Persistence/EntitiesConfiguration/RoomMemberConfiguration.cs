using ManyWatch.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ManyWatch.Infrastructure.Persistence.EntitiesConfiguration;

public class RoomMemberConfiguration : IEntityTypeConfiguration<RoomMember>
{
    public void Configure(EntityTypeBuilder<RoomMember> builder)
    {
        builder.HasKey(member => new
        {
            member.RoomId,
            member.UserId
        });

        builder.Property(member => member.JoinedAt)
            .IsRequired();

        builder.Property(member => member.IsHost)
            .IsRequired();

        builder.HasIndex(member => member.UserId);
    }
}