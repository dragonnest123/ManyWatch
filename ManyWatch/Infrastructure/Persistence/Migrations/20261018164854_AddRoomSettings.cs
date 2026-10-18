using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ManyWatch.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddRoomSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "join_policy",
                table: "rooms",
                type: "character varying(32)",
                maxLength: 32,
                nullable: false,
                defaultValue: "Everyone");

            migrationBuilder.AddColumn<int>(
                name: "max_members",
                table: "rooms",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "join_policy",
                table: "rooms");

            migrationBuilder.DropColumn(
                name: "max_members",
                table: "rooms");
        }
    }
}
