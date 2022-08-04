import { useCallback, useContext, useEffect, useState } from "react";
import { Link, RouteComponentProps } from "@reach/router";

import { User, UserContext } from "../../models";

export type TypedId = {
  type: string;
  id: string;
};
type Fact = {
  predicate: string;
  args: TypedId[];
};

export const Index = (_: RouteComponentProps) => {
  const { current: currentUser } = useContext(UserContext);
  const [roles, setRoles] = useState<Fact[]>([]);
  const [userInput, setUserInput] = useState<string>("");
  const [roleInput, setRoleInput] = useState<string>("");
  const [typeInput, setTypeInput] = useState<string>("");
  const [nameInput, setNameInput] = useState<string>("");

  const refresh = useCallback(() => {
    if (!(currentUser instanceof User)) return;
    currentUser.oso("GET", "facts?predicate=has_role").then(setRoles);
  }, [currentUser]);

  const revoke = useCallback(
    (fact: Fact) => {
      if (!(currentUser instanceof User)) return;
      currentUser.oso("DELETE", "facts", fact).then(refresh);
    },
    [currentUser, refresh]
  );

  const grant = useCallback(
    (fact: Fact) => {
      if (!(currentUser instanceof User)) return;
      currentUser.oso("POST", "facts", fact).then(refresh);
    },
    [currentUser, refresh]
  );

  const grantFact: Fact = {
    predicate: "has_role",
    args: [
      {
        type: "User",
        id: userInput,
      },
      {
        type: "String",
        id: roleInput,
      },
      {
        type: typeInput,
        id: nameInput,
      },
    ],
  };

  useEffect(refresh, [refresh]);

  if (!(currentUser instanceof User))
    return (
      <>
        Please <Link to="/login">log in</Link>.
      </>
    );

  return (
    <>
      <h1>Role management</h1>
      <table>
        <thead>
          <tr>
            <td>User</td>
            <td>Role</td>
            <td>Type</td>
            <td>Name</td>
          </tr>
        </thead>
        <tbody>
          {roles.map((role) => (
            <tr>
              <td>{role.args[0].id}</td>
              <td>{role.args[1].id}</td>
              <td>{role.args[2].type}</td>
              <td>{role.args[2].id}</td>
              <button onClick={revoke.bind(null, role)}>Revoke</button>
            </tr>
          ))}
          <tr>
            <td>
              <input
                type="text"
                value={userInput}
                onInput={(e) =>
                  setUserInput((e.target as HTMLInputElement).value)
                }
              />
            </td>
            <td>
              <input
                type="text"
                value={roleInput}
                onInput={(e) =>
                  setRoleInput((e.target as HTMLInputElement).value)
                }
              />
            </td>
            <td>
              <input
                type="text"
                value={typeInput}
                onInput={(e) =>
                  setTypeInput((e.target as HTMLInputElement).value)
                }
              />
            </td>
            <td>
              <input
                type="text"
                value={nameInput}
                onInput={(e) =>
                  setNameInput((e.target as HTMLInputElement).value)
                }
              />
            </td>
            <button onClick={grant.bind(null, grantFact)}>Grant</button>
          </tr>
        </tbody>
      </table>
    </>
  );
};
