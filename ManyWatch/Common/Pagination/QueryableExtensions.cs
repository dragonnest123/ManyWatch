using Microsoft.EntityFrameworkCore;

namespace ManyWatch.Common.Pagination;

public static class QueryableExtensions
{
    public static async Task<PagedResult<T>> ToPagedResultAsync<T>(
        this IQueryable<T> query,
        PageInfo pageInfo,
        CancellationToken cancellationToken = default)
    {
        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((pageInfo.PageNumber - 1) * pageInfo.PageSize)
            .Take(pageInfo.PageSize)
            .ToArrayAsync(cancellationToken);

        return new PagedResult<T>(items, totalCount, pageInfo);
    }
}