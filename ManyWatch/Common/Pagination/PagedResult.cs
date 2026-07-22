namespace ManyWatch.Common.Pagination;

public record PagedResult<T>(
    IReadOnlyCollection<T> Items,
    int TotalItemsCount,
    PageInfo PageInfo);