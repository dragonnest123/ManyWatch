namespace ManyWatch.Domain;

public class RoomPlayback
{
    public Guid RoomId { get; init; }
    public Room? Room { get; init; }
    public string? VideoUrl { get; set; }
    public bool IsPlaying { get; set; }
    public double PositionSeconds { get; set; }
    public double DurationSeconds { get; set; }
    public DateTime UpdatedAt { get; set; }
    public Guid UpdatedByUserId { get; set; }

    private RoomPlayback()
    {
    }

    public RoomPlayback(Guid roomId)
    {
        RoomId = roomId;
    }

    public void Update(
        string? videoUrl,
        bool isPlaying,
        double positionSeconds,
        double durationSeconds,
        Guid updatedByUserId)
    {
        VideoUrl = videoUrl;
        IsPlaying = isPlaying;
        PositionSeconds = positionSeconds;
        DurationSeconds = durationSeconds;
        UpdatedAt = DateTime.UtcNow;
        UpdatedByUserId = updatedByUserId;
    }
    
    public double GetEffectivePositionSeconds(DateTime? utcNow = null)
    {
        if (!IsPlaying)
            return PositionSeconds;

        var elapsed = ((utcNow ?? DateTime.UtcNow) - UpdatedAt).TotalSeconds;
        return Math.Max(0, PositionSeconds + elapsed);
    }
}
