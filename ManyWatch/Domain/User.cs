namespace ManyWatch.Domain;

public class User
{
    public const int MaxDisplayNameLength = 64;
    public const int MaxBioLength = 500;

    public Guid Id { get; set; }
    public string Email { get; set; }
    public string PasswordHash { get; set; }
    public string DisplayName { get; set; }
    public string? Bio { get; set; }
    public long WatchedSeconds { get; set; }
    public DateTime? AvatarUpdatedAt { get; set; }
    public DateTime CreatedAt { get; set; }

    private User()
    {
    }

    public User(string email, string passwordHash, string displayName)
    {
        Id = Guid.CreateVersion7();
        Email = email;
        PasswordHash = passwordHash;
        DisplayName = displayName;
        WatchedSeconds = 0;
        CreatedAt = DateTime.UtcNow;
    }

    public void UpdateProfile(string displayName, string? bio)
    {
        DisplayName = displayName;
        Bio = string.IsNullOrWhiteSpace(bio) ? null : bio.Trim();
    }

    public void AddWatchedSeconds(long seconds)
    {
        if (seconds <= 0)
            throw new ArgumentOutOfRangeException(nameof(seconds), "Watched seconds must be positive");

        WatchedSeconds += seconds;
    }
}
