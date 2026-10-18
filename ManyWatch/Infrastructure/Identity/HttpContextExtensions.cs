namespace ManyWatch.Infrastructure.Identity;

public static class HttpContextExtensions
{
    private const string ItemKey = "ManyWatch.AnonymousUserId";

    public static void SetAnonymousUserId(this HttpContext context, Guid userId)
    {
        context.Items[ItemKey] = userId;
    }

    public static Guid GetAnonymousUserId(this HttpContext context)
    {
        return context.Items[ItemKey] is Guid userId
            ? userId
            : throw new InvalidOperationException(
                "Anonymous identity has not been resolved for this request. " +
                "Ensure AnonymousIdentityMiddleware is registered.");
    }
}
