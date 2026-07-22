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
