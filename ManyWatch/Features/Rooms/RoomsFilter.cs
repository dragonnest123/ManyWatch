using ManyWatch.Domain;
using Microsoft.EntityFrameworkCore;

namespace ManyWatch.Features.Rooms;

public record RoomsFilterParameters
{
    public bool? IsPrivate { get; init; }
    public string? Name { get; init; }
}

public static class RoomsFilter
{
    extension(IQueryable<Room> query)
    {
        public IQueryable<Room> Filter(RoomsFilterParameters? parameters)
            => parameters is not null
                ? query.FilterIfPrivate(parameters).FilterIfName(parameters)
                : query;

        private IQueryable<Room> FilterIfPrivate(RoomsFilterParameters parameters)
            => parameters.IsPrivate is not null
                ? query.Where(r => r.IsPrivate == parameters.IsPrivate)
                : query;

        private IQueryable<Room> FilterIfName(RoomsFilterParameters parameters)
            => !string.IsNullOrWhiteSpace(parameters.Name)
                ? query.Where(r => EF.Functions.ILike(r.Name, $"%{parameters.Name}%"))
                : query;
    }
}