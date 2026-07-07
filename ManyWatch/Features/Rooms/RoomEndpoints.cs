namespace ManyWatch.Features.Rooms;

public static class RoomEndpoints
{
    extension(WebApplication app)
    {
        public WebApplication AddRoomEndpoints()
        {
            app.MapGroup("rooms");
            app.MapPost("/", CreateRoom.Handle);
            app.MapGet("/{code}", GetRoom.Handle);
        }
    }
}