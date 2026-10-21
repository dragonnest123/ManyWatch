using FluentValidation;

namespace ManyWatch.Features.Friends;

public sealed class AddFriendRequestValidator : AbstractValidator<AddFriendRequest>
{
    public AddFriendRequestValidator()
    {
        RuleFor(request => request.UserId)
            .NotEmpty()
            .WithMessage("User is required");
    }
}

public sealed class InviteFriendRequestValidator : AbstractValidator<InviteFriendRequest>
{
    public InviteFriendRequestValidator()
    {
        RuleFor(request => request.FriendId)
            .NotEmpty()
            .WithMessage("Friend is required");

        RuleFor(request => request.RoomId)
            .NotEmpty()
            .WithMessage("Room is required");
    }
}
