using ManyWatch.Domain;
using ManyWatch.Features.Auth;
using ManyWatch.Features.Profile;
using ManyWatch.Features.Rooms;

namespace ManyWatch.Tests.Features;

public class ValidatorsTests
{
    [Fact]
    public void CreateRoom_ValidName_Passes()
    {
        var result = new CreateRoomValidator().Validate(new CreateRoomRequest("movie night"));

        Assert.True(result.IsValid);
    }

    [Fact]
    public void CreateRoom_EmptyName_Fails()
    {
        var result = new CreateRoomValidator().Validate(new CreateRoomRequest(""));

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, error => error.ErrorMessage == "Room name is required");
    }

    [Fact]
    public void CreateRoom_NameLongerThanLimit_Fails()
    {
        var result = new CreateRoomValidator().Validate(new CreateRoomRequest(new string('a', 65)));

        Assert.False(result.IsValid);
    }

    [Fact]
    public void RenameRoom_EmptyName_Fails()
    {
        var result = new RenameRoomValidator().Validate(new RenameRoomRequest(""));

        Assert.False(result.IsValid);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(501)]
    public void UpdateRoomSettings_MaxMembersOutOfRange_Fails(int maxMembers)
    {
        var result = new UpdateRoomSettingsValidator()
            .Validate(new UpdateRoomSettingsRequest(false, maxMembers, RoomJoinPolicy.Everyone));

        Assert.False(result.IsValid);
    }

    [Theory]
    [InlineData(1)]
    [InlineData(2)]
    [InlineData(500)]
    [InlineData(null)]
    public void UpdateRoomSettings_MaxMembersInRangeOrNull_Passes(int? maxMembers)
    {
        var result = new UpdateRoomSettingsValidator()
            .Validate(new UpdateRoomSettingsRequest(false, maxMembers, RoomJoinPolicy.Everyone));

        Assert.True(result.IsValid);
    }

    [Fact]
    public void UpdateRoomSettings_UnknownJoinPolicy_Fails()
    {
        var result = new UpdateRoomSettingsValidator()
            .Validate(new UpdateRoomSettingsRequest(false, null, (RoomJoinPolicy)99));

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, error => error.ErrorMessage == "Unknown join policy");
    }

    [Fact]
    public void UpdateProfile_LongBio_Fails()
    {
        var result = new UpdateProfileValidator()
            .Validate(new UpdateProfileRequest("Viewer", new string('a', 501)));

        Assert.False(result.IsValid);
    }

    [Fact]
    public void UpdateProfile_ValidValues_Passes()
    {
        var result = new UpdateProfileValidator()
            .Validate(new UpdateProfileRequest("Viewer", "About me"));

        Assert.True(result.IsValid);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(301)]
    public void RecordWatchTime_OutOfRange_Fails(long seconds)
    {
        var result = new RecordWatchTimeValidator()
            .Validate(new RecordWatchTimeRequest(seconds));

        Assert.False(result.IsValid);
    }

    [Fact]
    public void RecordWatchTime_ValidValue_Passes()
    {
        var result = new RecordWatchTimeValidator()
            .Validate(new RecordWatchTimeRequest(15));

        Assert.True(result.IsValid);
    }

    [Fact]
    public void UpdateAvatar_InvalidDataUrl_Fails()
    {
        var result = new UpdateAvatarValidator()
            .Validate(new UpdateAvatarRequest("https://example.com/avatar.png"));

        Assert.False(result.IsValid);
    }

    [Fact]
    public void Register_InvalidEmail_Fails()
    {
        var result = new RegisterValidator().Validate(new RegisterRequest("not-an-email", "password123", "Name"));

        Assert.False(result.IsValid);
    }

    [Fact]
    public void Register_ShortPassword_Fails()
    {
        var result = new RegisterValidator().Validate(new RegisterRequest("user@example.com", "short", "Name"));

        Assert.False(result.IsValid);
    }
}
