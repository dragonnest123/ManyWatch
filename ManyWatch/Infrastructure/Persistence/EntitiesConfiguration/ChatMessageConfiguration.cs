using ManyWatch.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ManyWatch.Infrastructure.Persistence.EntitiesConfiguration;

public class ChatMessageConfiguration : IEntityTypeConfiguration<ChatMessage>
{
    public void Configure(EntityTypeBuilder<ChatMessage> builder)
    {
        builder.HasKey(message => message.Id);

        builder.Property(message => message.Content)
            .IsRequired()
            .HasMaxLength(ChatMessage.MaxContentLength);

        builder.Property(message => message.SentAt)
            .IsRequired();

        builder.HasIndex(message => new
        {
            message.RoomId,
            message.SentAt
        });

        builder.HasOne(message => message.Room)
            .WithMany(room => room.Messages)
            .HasForeignKey(message => message.RoomId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
