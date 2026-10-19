using ManyWatch.Domain;

namespace ManyWatch.Tests.Domain;

public class RoomPlaybackTests
{
    private const string VideoUrl = "https://example.com/movie.mp4";

    [Fact]
    public void Update_StoresPlaybackState()
    {
        var playback = new RoomPlayback(Guid.NewGuid());
        var userId = Guid.NewGuid();

        playback.Update(VideoUrl, isPlaying: true, positionSeconds: 12.5, durationSeconds: 120, userId);

        Assert.Equal(VideoUrl, playback.VideoUrl);
        Assert.True(playback.IsPlaying);
        Assert.Equal(12.5, playback.PositionSeconds);
        Assert.Equal(120, playback.DurationSeconds);
        Assert.Equal(userId, playback.UpdatedByUserId);
        Assert.True(playback.UpdatedAt <= DateTime.UtcNow);
    }

    [Fact]
    public void GetEffectivePositionSeconds_WhenPaused_ReturnsStoredPosition()
    {
        var playback = new RoomPlayback(Guid.NewGuid());
        playback.Update(VideoUrl, isPlaying: false, positionSeconds: 42, durationSeconds: 120, Guid.NewGuid());

        var position = playback.GetEffectivePositionSeconds(playback.UpdatedAt.AddMinutes(5));

        Assert.Equal(42, position);
    }

    [Fact]
    public void GetEffectivePositionSeconds_WhenPlaying_AddsElapsedTime()
    {
        var playback = new RoomPlayback(Guid.NewGuid());
        playback.Update(VideoUrl, isPlaying: true, positionSeconds: 10, durationSeconds: 120, Guid.NewGuid());

        var position = playback.GetEffectivePositionSeconds(playback.UpdatedAt.AddSeconds(7.5));

        Assert.Equal(17.5, position, precision: 3);
    }

    [Fact]
    public void GetEffectivePositionSeconds_WhenClockMovedBackward_ClampsToZero()
    {
        var playback = new RoomPlayback(Guid.NewGuid());
        playback.Update(VideoUrl, isPlaying: true, positionSeconds: 3, durationSeconds: 120, Guid.NewGuid());

        var position = playback.GetEffectivePositionSeconds(playback.UpdatedAt.AddSeconds(-30));

        Assert.Equal(0, position);
    }
}
