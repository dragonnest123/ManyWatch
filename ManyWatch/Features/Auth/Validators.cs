using FluentValidation;

namespace ManyWatch.Features.Auth;

public sealed class RegisterValidator : AbstractValidator<RegisterRequest>
{
    public RegisterValidator()
    {
        RuleFor(request => request.Email)
            .NotEmpty()
            .WithMessage("Email is required")
            .EmailAddress()
            .WithMessage("Email must be a valid email address")
            .MaximumLength(256)
            .WithMessage("Email must be 256 characters or fewer");

        RuleFor(request => request.Password)
            .NotEmpty()
            .WithMessage("Password is required")
            .MinimumLength(8)
            .WithMessage("Password must be at least 8 characters long");

        RuleFor(request => request.DisplayName)
            .NotEmpty()
            .WithMessage("Display name is required")
            .MaximumLength(64)
            .WithMessage("Display name must be 64 characters or fewer");
    }
}

public sealed class LoginValidator : AbstractValidator<LoginRequest>
{
    public LoginValidator()
    {
        RuleFor(request => request.Email)
            .NotEmpty()
            .WithMessage("Email is required");

        RuleFor(request => request.Password)
            .NotEmpty()
            .WithMessage("Password is required");
    }
}
