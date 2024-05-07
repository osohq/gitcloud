export class User {
  id: number;
  username: string;
  name: string;
  email: string;

  constructor({ id, username, name, email }: User) {
    this.id = id;
    this.username = username;
    this.email = email;
    this.name = name;
  }
}
