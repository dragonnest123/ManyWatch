using FluentValidation;
using ManyWatch.Domain;

namespace ManyWatch.Features.Profile;

public sealed class UpdateProfileValidator : AbstractValidator<UpdateProfileRequest>
{
    public UpdateProfileValidator()
    {
        RuleFor(request => request.DisplayName)
            .NotEmpty()
            .WithMessage("Display name is required")
            .MaximumLength(User.MaxDisplayNameLength)
            .WithMessage($"Display name must be {User.MaxDisplayNameLength} characters or fewer");

        RuleFor(request => request.Bio)
            .MaximumLength(User.MaxBioLength)
            .WithMessage($"Bio must be {User.MaxBioLength} characters or fewer");
    }
}

public sealed class UpdateAvatarValidator : AbstractValidator<UpdateAvatarRequest>
{
    public UpdateAvatarValidator()
    {
        RuleFor(request => request.DataUrl)
            .Cascade(CascadeMode.Stop)
            .NotEmpty()
            .WithMessage("Avatar image is required")
            .Must(AvatarDataUrl.IsValid)
            .WithMessage("Avatar must be a PNG, JPEG or WebP image up to 512 KB");
    }
}

public sealed class RecordWatchTimeValidator : AbstractValidator<RecordWatchTimeRequest>
{
    public RecordWatchTimeValidator()
    {
        RuleFor(request => request.Seconds)
            .InclusiveBetween(1, 300)
            .WithMessage("Watch time must be between 1 and 300 seconds");
    }
}
