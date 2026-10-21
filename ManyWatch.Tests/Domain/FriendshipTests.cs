using ManyWatch.Domain;

namespace ManyWatch.Tests.Domain;

public class FriendshipTests
{
    [Fact]
    public void Constructor_OrdersParticipants_AndStartsAsPending()
    {
        var first = Guid.CreateVersion7();
        var second = Guid.CreateVersion7();

        var friendship = new Friendship(first, second);

        Assert.True(friendship.UserLowId.CompareTo(friendship.UserHighId) < 0);
        Assert.Equal(first, friendship.RequestedById);
        Assert.Equal(FriendshipStatus.Pending, friendship.Status);
        Assert.Null(friendship.RespondedAt);
    }

    [Fact]
    public void Constructor_RejectsSelfFriendship()
    {
        var userId = Guid.CreateVersion7();

        Assert.Throws<ArgumentException>(() => new Friendship(userId, userId));
    }

    [Fact]
    public void Accept_OnlyAllowedForAddressee()
    {
        var requesterId = Guid.CreateVersion7();
        var addresseeId = Guid.CreateVersion7();
        var friendship = new Friendship(requesterId, addresseeId);

        Assert.False(friendship.CanAccept(requesterId));
        Assert.Throws<InvalidOperationException>(() => friendship.Accept(requesterId));

        friendship.Accept(addresseeId);

        Assert.Equal(FriendshipStatus.Accepted, friendship.Status);
        Assert.NotNull(friendship.RespondedAt);
        Assert.Equal(requesterId, friendship.OtherUserId(addresseeId));
        Assert.Throws<InvalidOperationException>(() => friendship.Accept(addresseeId));
    }
}
