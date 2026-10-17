using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ManyWatch.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddRoomMemberLastSeenAt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "last_seen_at",
                table: "room_members",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.Sql("UPDATE room_members SET last_seen_at = joined_at");

            migrationBuilder.AlterColumn<DateTime>(
                name: "last_seen_at",
                table: "room_members",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldNullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "last_seen_at",
                table: "room_members");
        }
    }
}
