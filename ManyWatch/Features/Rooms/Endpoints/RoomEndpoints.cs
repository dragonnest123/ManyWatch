using ManyWatch.Infrastructure.EndpointFilters;

namespace ManyWatch.Features.Rooms.Endpoints;

public static class RoomEndpoints
{
    extension(WebApplication app)
    {
        public WebApplication MapRoomEndpoints()
        {
            var rooms = app.MapGroup("/rooms")
                .WithTags("Rooms");

            rooms.MapGet("/", GetRooms.Handle)
                .WithTags("GetRooms");

            rooms.MapGet("/{id:guid}", GetRoom.Handle)
                .WithTags("GetRoom");
            
            rooms.MapPost("/create", CreateRoom.Handle)
                .AddEndpointFilter<ValidationFilter<CreateRoomRequest>>()
                .WithTags("CreateRoom");
            
            rooms.MapPost("/{id:guid}/join", JoinRoom.Handle)
                .WithTags("JoinRoom");

            rooms.MapPost("/{id:guid}/leave", LeaveRoom.Handle)
                .WithTags("LeaveRoom");

            rooms.MapPost("/{id:guid}/heartbeat", Heartbeat.Handle)
                .WithTags("Heartbeat");

            rooms.MapPost("/{id:guid}/members/{userId:guid}/ban", BanMember.Handle)
                .WithTags("BanMember");

            rooms.MapDelete("/{id:guid}/members/{userId:guid}/ban", UnbanMember.Handle)
                .WithTags("UnbanMember");

            rooms.MapDelete("/{id:guid}", DeleteRoom.Handle)
                .WithTags("DeleteRoom");

            return app;
        }
    }
}
