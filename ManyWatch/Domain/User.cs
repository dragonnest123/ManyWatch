namespace ManyWatch.Domain;

public class User
{
    public Guid Id { get; set; }
    public string Email { get; set; }
    public string PasswordHash { get; set; }
    public string DisplayName { get; set; }
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
        CreatedAt = DateTime.UtcNow;
    }
}