using ManyWatch.Domain;
using Microsoft.EntityFrameworkCore;

namespace ManyWatch.Infrastructure.Persistence;

public static class DbSeeder
{
    public static void Seed(AppDbContext db)
    {
        if (db.Rooms.Any())
            return;

        db.Rooms.AddRange(GenerateRooms());
        db.SaveChanges();
    }

    private static Room[] GenerateRooms()
    {
        var rooms = new Room[50];

        for (int i = 0; i < rooms.Length; i++)
        {
            var isPrivate = Random.Shared.Next(0, 2) == 0;
            rooms[i] = new Room(Guid.CreateVersion7(), $"room{i}", isPrivate);
            GenerateRoomMembers(rooms[i]);
        }
        
        return rooms;
    }

    private static void GenerateRoomMembers(Room room)
    {
        var memberCount = Random.Shared.Next(1, 5);
        
        room.Members = new List<RoomMember>(memberCount)
        {
            new RoomMember(Guid.CreateVersion7(), room.Id, true)
        };

        for (int i = 1; i < memberCount; i++)
            room.Members.Add(new RoomMember(Guid.CreateVersion7(), room.Id, false));
    }
}