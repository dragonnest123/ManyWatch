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
                .AddEndpointFilter<ValidationFilter<CreateRoomRequest>>();

            rooms.MapGet("/{id:guid}", GetRoom.Handle);

            rooms.MapPost("/{id:guid}/join", JoinRoom.Handle)
                .AddEndpointFilter<ValidationFilter<JoinRoomRequest>>();

            rooms.MapPost("/{id:guid}/leave", LeaveRoom.Handle)
                .AddEndpointFilter<ValidationFilter<LeaveRoomRequest>>();

            rooms.MapDelete("/{id:guid}", DeleteRoom.Handle)
                .AddEndpointFilter<ValidationFilter<DeleteRoomRequest>>();

            return app;
        }
    }
}