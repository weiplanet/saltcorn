const { Command, flags } = require("@oclif/command");
const { cli } = require("cli-ux");

class CreateUserCommand extends Command {
  async run() {
    const User = require("@saltcorn/data/models/user");
    const { flags } = this.parse(CreateUserCommand);
    const email = await cli.prompt("Email address");
    const password = await cli.prompt("Password", { type: "hide" });
    await User.create({ email, password, role_id: flags.admin ? 1 : 8 });
    this.exit(0);
  }
}

CreateUserCommand.description = `Create a new user`;

CreateUserCommand.flags = {
  admin: flags.boolean({ char: "a", description: "Admin user" }),
};

module.exports = CreateUserCommand;
