using System.Text.Json;
using System.Text.Json.Serialization;
using ManyWatch.Features.Auth.Endpoints;
using ManyWatch.Features.Rooms;
using ManyWatch.Features.Rooms.Endpoints;
using ManyWatch.Infrastructure;
using ManyWatch.Infrastructure.Identity;
using ManyWatch.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

// builder.Services.ConfigureHttpJsonOptions(options =>
// {
//     options.SerializerOptions.TypeInfoResolverChain.Insert(0, AppJsonSerializerContext.Default);
// });
builder.Services.AddOpenApi();
builder.Services.AddSwaggerGen();
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});
builder.Services.AddCors(options =>
{
    options.AddPolicy("Client", policy =>
    {
        policy
            .WithOrigins("http://localhost:5173", "http://127.0.0.1:5173")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});
builder.Services.AddInfrastructure(builder.Configuration, builder.Environment);
builder.Services.AddSignalR()
    .AddJsonProtocol(options =>
    {
        options.PayloadSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    });

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("Client");

app.UseMiddleware<AnonymousIdentityMiddleware>();

app.UseAuthentication();
app.UseAuthorization();

app.MapRoomEndpoints();
app.MapAuthEndpoints();
app.MapHub<RoomHub>("/hubs/rooms");

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider
        .GetRequiredService<AppDbContext>();

    if (!app.Environment.IsEnvironment("Testing"))
    {
        DbSeeder.Seed(db);
    }
}

app.Run();

/// <summary>Entry point marker used by integration tests (WebApplicationFactory&lt;Program&gt;).</summary>
public partial class Program;
//
// [JsonSerializable(typeof(Todo[]))]
// internal partial class AppJsonSerializerContext : JsonSerializerContext
// {
// }
