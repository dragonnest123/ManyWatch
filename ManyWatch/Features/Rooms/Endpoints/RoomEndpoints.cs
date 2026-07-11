using ManyWatch.Infrastructure.Filters;

namespace ManyWatch.Features.Rooms.Endpoints;

public static class RoomEndpoints
{
    extension(WebApplication app)
    {
        public WebApplication AddRoomEndpoints()
        {
            var rooms = app.MapGroup("/rooms")
                .WithTags("Rooms");

            rooms.MapPost("/", CreateRoom.Handle)
                .AddEndpointFilter<ValidationFilter<CreateRoomRequest>>()
                .WithTags("CreateRoom");

            rooms.MapGet("/{id:guid}", GetRoom.Handle)
                .WithTags("GetRoom");

            rooms.MapPost("/{id:guid}/join/{userId:guid}", JoinRoom.Handle)
                .WithTags("JoinRoom");

            rooms.MapPost("/{id:guid}/leave/{userId:guid}", LeaveRoom.Handle)
                .WithTags("LeaveRoom");

            rooms.MapDelete("/{id:guid}/{userId:guid}", DeleteRoom.Handle)
                .WithTags("DeleteRoom");

            return app;
        }
    }
}
