using ManyWatch.Infrastructure.EndpointFilters;

namespace ManyWatch.Features.Profile.Endpoints;

public static class ProfileEndpoints
{
    extension(WebApplication app)
    {
        public WebApplication MapProfileEndpoints()
        {
            var profile = app.MapGroup("/profile")
                .RequireAuthorization()
                .WithTags("Profile");

            profile.MapGet("/", GetProfile.Handle)
                .WithTags("GetProfile");

            profile.MapPut("/", UpdateProfile.Handle)
                .AddEndpointFilter<ValidationFilter<UpdateProfileRequest>>()
                .WithTags("UpdateProfile");

            profile.MapPut("/avatar", UploadAvatar.Handle)
                .AddEndpointFilter<ValidationFilter<UpdateAvatarRequest>>()
                .WithTags("UploadAvatar");

            profile.MapDelete("/avatar", DeleteAvatar.Handle)
                .WithTags("DeleteAvatar");

            profile.MapPost("/watch-time", RecordWatchTime.Handle)
                .AddEndpointFilter<ValidationFilter<RecordWatchTimeRequest>>()
                .WithTags("RecordWatchTime");

            app.MapGet("/users/{userId:guid}/avatar", GetAvatar.Handle)
                .AllowAnonymous()
                .WithTags("GetAvatar");

            return app;
        }
    }
}
