using FluentValidation;

namespace ManyWatch.Infrastructure.EndpointFilters;

public sealed class ValidationFilter<TRequest> : IEndpointFilter
{
    private readonly IValidator<TRequest> _validator;

    public ValidationFilter(IValidator<TRequest> validator)
    {
        _validator = validator;
    }

    public async ValueTask<object?> InvokeAsync(
        EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        var request = context.Arguments
            .OfType<TRequest>()
            .FirstOrDefault();

        if (request is null)
            return Results.BadRequest(new
            {
                error = $"Request body of type {typeof(TRequest).Name} is required"
            });
        
        var validationResult = await _validator.ValidateAsync(
            request,
            context.HttpContext.RequestAborted);

        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors
                .GroupBy(error => error.PropertyName)
                .ToDictionary(
                    group => group.Key,
                    group => group
                        .Select(error => error.ErrorMessage)
                        .ToArray());

            return Results.ValidationProblem(errors);
        }

        return await next(context);
    }
}
