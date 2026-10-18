using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ManyWatch.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddRoomPlayback : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "room_playbacks",
                columns: table => new
                {
                    room_id = table.Column<Guid>(type: "uuid", nullable: false),
                    video_url = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true),
                    is_playing = table.Column<bool>(type: "boolean", nullable: false),
                    position_seconds = table.Column<double>(type: "double precision", nullable: false),
                    duration_seconds = table.Column<double>(type: "double precision", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_by_user_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_room_playbacks", x => x.room_id);
                    table.ForeignKey(
                        name: "fk_room_playbacks_rooms_room_id",
                        column: x => x.room_id,
                        principalTable: "rooms",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "room_playbacks");
        }
    }
}
