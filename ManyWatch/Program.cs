using ManyWatch.Features.Rooms.Endpoints;
using ManyWatch.Infrastructure;
using ManyWatch.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

// builder.Services.ConfigureHttpJsonOptions(options =>
// {
//     options.SerializerOptions.TypeInfoResolverChain.Insert(0, AppJsonSerializerContext.Default);
// });
builder.Services.AddOpenApi();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(options =>
{
    options.AddPolicy("Client", policy =>
    {
        policy
            .WithOrigins("http://localhost:5173", "http://127.0.0.1:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});
builder.Services.AddInfrastructure(builder.Configuration);

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapRoomEndpoints();
app.UseCors("Client");

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider
        .GetRequiredService<AppDbContext>();

    DbSeeder.Seed(db);
}

app.Run();
//
// [JsonSerializable(typeof(Todo[]))]
// internal partial class AppJsonSerializerContext : JsonSerializerContext
// {
// }
