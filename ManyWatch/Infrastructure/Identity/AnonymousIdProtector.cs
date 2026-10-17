using System.Security.Cryptography;
using Microsoft.AspNetCore.DataProtection;

namespace ManyWatch.Infrastructure.Identity;

public sealed class AnonymousIdProtector
{
    private const string ProtectorPurpose = "ManyWatch.AnonymousId.v1";

    private readonly IDataProtector _protector;

    public AnonymousIdProtector(IDataProtectionProvider provider)
    {
        _protector = provider.CreateProtector(ProtectorPurpose);
    }

    public string Protect(Guid userId)
    {
        return _protector.Protect(userId.ToString());
    }

    public Guid? Unprotect(string value)
    {
        try
        {
            return Guid.TryParse(_protector.Unprotect(value), out var userId)
                ? userId
                : null;
        }
        catch (CryptographicException)
        {
            return null;
        }
    }
}
