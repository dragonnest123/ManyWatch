using FluentValidation;

namespace ManyWatch.Features.Rooms;

public sealed class CreateRoomValidator : AbstractValidator<CreateRoomRequest>
{
    public CreateRoomValidator()
    {
        RuleFor(request => request.Name)
            .NotEmpty()
            .WithMessage("Room name is required.")
            .MaximumLength(64)
            .WithMessage("Room name must be 64 characters or fewer.");
    }
}