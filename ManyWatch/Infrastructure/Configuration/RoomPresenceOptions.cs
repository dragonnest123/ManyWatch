namespace ManyWatch.Infrastructure.Configuration;

public class RoomPresenceOptions
{
    public const string SectionName = "RoomPresence";

    public TimeSpan MemberTimeout { get; } = TimeSpan.FromMinutes(2);
    public TimeSpan CleanupInterval { get; } = TimeSpan.FromSeconds(15);
}