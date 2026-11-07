using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ManyWatch.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddUserUsername : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "username",
                table: "users",
                type: "character varying(32)",
                maxLength: 32,
                nullable: true);

            migrationBuilder.Sql(
                """
                DO $$
                DECLARE
                    user_record RECORD;
                    base_name TEXT;
                    candidate TEXT;
                    suffix INTEGER;
                BEGIN
                    FOR user_record IN SELECT id, display_name FROM users LOOP
                        base_name := lower(regexp_replace(user_record.display_name, '[^a-zA-Z0-9]+', '', 'g'));
                        base_name := left(base_name, 24);

                        IF base_name = '' OR base_name !~ '^[a-z]' THEN
                            base_name := 'user' || substr(replace(user_record.id::text, '-', ''), 1, 8);
                        END IF;

                        candidate := base_name;
                        suffix := 1;

                        WHILE EXISTS (
                            SELECT 1
                            FROM users
                            WHERE lower(username) = lower(candidate)
                              AND id <> user_record.id
                        ) LOOP
                            suffix := suffix + 1;
                            candidate := left(base_name, 32 - length(suffix::text) - 1) || '_' || suffix;
                        END LOOP;

                        UPDATE users
                        SET username = lower(candidate)
                        WHERE id = user_record.id;
                    END LOOP;
                END $$;
                """);

            migrationBuilder.AlterColumn<string>(
                name: "username",
                table: "users",
                type: "character varying(32)",
                maxLength: 32,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(32)",
                oldMaxLength: 32,
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_users_username",
                table: "users",
                column: "username",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_users_username",
                table: "users");

            migrationBuilder.DropColumn(
                name: "username",
                table: "users");
        }
    }
}
