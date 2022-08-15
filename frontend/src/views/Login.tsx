import { ChangeEvent, FormEvent, useContext, useState } from "react";
import { Redirect, RouteComponentProps } from "@reach/router";

import { UserContext } from "../models";
import { NoticeContext } from "../components";
import { session as sessionApi } from "../api";

export function Login(_: RouteComponentProps) {
  const user = useContext(UserContext);
  const { error } = useContext(NoticeContext);
  const [username, setUsername] = useState<string>("");

  // If a logged-in user navigates to this page, redirect to home.
  if (user.loggedIn()) return <Redirect to="/" noThrow />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      const u = await sessionApi.login({ username: username });
      user.update(u);
      // TODO(gj): navigate(-1) throws errors that I don't feel like debugging.
      window.history.back();
    } catch (e) {
      error(`Failed to log in: ${e.message}`);
    }
  }

  function handleChange({ target: { value } }: ChangeEvent<HTMLInputElement>) {
    setUsername(value);
  }

  return (
    <>
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Username: <input type="text" value={username} onChange={handleChange} />
        </label>{" "}
        <input
          type="submit"
          value="log in"
          disabled={!username.replaceAll(" ", "")}
        />
      </form>
    </>
  );
}
