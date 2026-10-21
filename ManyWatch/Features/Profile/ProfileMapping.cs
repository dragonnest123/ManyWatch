using ManyWatch.Domain;

namespace ManyWatch.Features.Profile;

public static class ProfileMapping
{
    public static string? AvatarUrl(User user)
    {
        return user.AvatarUpdatedAt is null
            ? null
            : $"/users/{user.Id:D}/avatar?v={user.AvatarUpdatedAt.Value.Ticks}";
    }

    extension(User user)
    {
        public ProfileResponse ToProfileResponse(int friendCount)
        {
            return new ProfileResponse(
                user.Id,
                user.Email,
                user.DisplayName,
                user.Bio,
                AvatarUrl(user),
                user.CreatedAt,
                user.WatchedSeconds,
                friendCount);
        }
    }
}
