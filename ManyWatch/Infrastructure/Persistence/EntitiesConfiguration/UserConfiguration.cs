using ManyWatch.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ManyWatch.Infrastructure.Persistence.EntitiesConfiguration;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.HasKey(user => user.Id);

        builder.Property(user => user.Email)
            .IsRequired()
            .HasMaxLength(256);

        builder.HasIndex(user => user.Email)
            .IsUnique();

        builder.Property(user => user.PasswordHash)
            .IsRequired();

        builder.Property(user => user.DisplayName)
            .IsRequired()
            .HasMaxLength(64);

        builder.Property(user => user.CreatedAt)
            .IsRequired();
    }
}
