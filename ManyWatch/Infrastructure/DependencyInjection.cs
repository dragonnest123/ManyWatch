using FluentValidation;
using ManyWatch.Features.Rooms;
using ManyWatch.Infrastructure.Filters;
using ManyWatch.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ManyWatch.Infrastructure;

public static class DependencyInjection
{
    extension(IServiceCollection services)
    {
        public IServiceCollection AddInfrastructure(IConfiguration configuration)
        {
            services
                .AddPersistence(configuration)
                .AddFilters();
            
            return services;
        }

        private IServiceCollection AddPersistence(IConfiguration configuration)
        {
            services.AddNpgsql<AppDbContext>(
                configuration.GetConnectionString("DefaultConnection"),
                _ => { },
                opt => opt.UseSnakeCaseNamingConvention());
            
            return services;
        }

        private IServiceCollection AddFilters()
        {
            services.AddSingleton<IValidator<CreateRoomRequest>, CreateRoomValidator>();
            
            return services;
        }
    }
}