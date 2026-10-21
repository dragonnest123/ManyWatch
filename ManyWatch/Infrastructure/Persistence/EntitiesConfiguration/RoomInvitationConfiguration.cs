using ManyWatch.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ManyWatch.Infrastructure.Persistence.EntitiesConfiguration;

public class RoomInvitationConfiguration : IEntityTypeConfiguration<RoomInvitation>
{
    public void Configure(EntityTypeBuilder<RoomInvitation> builder)
    {
        builder.HasKey(invitation => invitation.Id);

        builder.Property(invitation => invitation.CreatedAt)
            .IsRequired();

        builder.HasIndex(invitation => new
        {
            invitation.RecipientId,
            invitation.CreatedAt
        });

        builder.HasIndex(invitation => new
        {
            invitation.SenderId,
            invitation.RecipientId,
            invitation.RoomId
        });

        builder.HasOne(invitation => invitation.Room)
            .WithMany()
            .HasForeignKey(invitation => invitation.RoomId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(invitation => invitation.Sender)
            .WithMany()
            .HasForeignKey(invitation => invitation.SenderId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
