using FluentValidation;

namespace ManyWatch.Features.Rooms;

public sealed class CreateRoomValidator : AbstractValidator<CreateRoomRequest>
{
    public CreateRoomValidator()
    {
        RuleFor(request => request.Name)
            .NotEmpty()
            .WithMessage("Room name is required")
            .MaximumLength(64)
            .WithMessage("Room name must be 64 characters or fewer");
    }
}

public sealed class RenameRoomValidator : AbstractValidator<RenameRoomRequest>
{
    public RenameRoomValidator()
    {
        RuleFor(request => request.Name)
            .NotEmpty()
            .WithMessage("Room name is required")
            .MaximumLength(64)
            .WithMessage("Room name must be 64 characters or fewer");
    }
}

public sealed class UpdateRoomSettingsValidator : AbstractValidator<UpdateRoomSettingsRequest>
{
    public UpdateRoomSettingsValidator()
    {
        RuleFor(request => request.MaxMembers)
            .InclusiveBetween(1, 500)
            .When(request => request.MaxMembers is not null)
            .WithMessage("Max participants must be between 2 and 500");

        RuleFor(request => request.JoinPolicy)
            .IsInEnum()
            .WithMessage("Unknown join policy");
    }
}
