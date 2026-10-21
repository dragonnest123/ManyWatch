using ManyWatch.Features.Auth.Endpoints;
using ManyWatch.Features.Friends;
using ManyWatch.Features.Friends.Endpoints;
using ManyWatch.Features.Profile.Endpoints;
using ManyWatch.Features.Rooms.Endpoints;
using ManyWatch.Features.Rooms.Hubs;
using ManyWatch.Infrastructure;
using ManyWatch.Infrastructure.Identity;
using ManyWatch.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddSwaggerGen();
builder.Services.AddInfrastructure(builder.Configuration, builder.Environment);

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
app.MapFriendsEndpoints();
app.MapProfileEndpoints();
app.MapHub<RoomPlaybackHub>("/hubs/rooms/playback");
app.MapHub<RoomChatHub>("/hubs/rooms/chat");
app.MapHub<FriendsHub>("/hubs/friends");

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

public partial class Program;
//
// [JsonSerializable(typeof(Todo[]))]
// internal partial class AppJsonSerializerContext : JsonSerializerContext
// {
// }
