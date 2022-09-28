export class User {
  username: string;
  name: string;
  email: string;

  constructor({ username, name, email }: User) {
    this.username = username;
    this.email = email;
    this.name = name;
  }
}
