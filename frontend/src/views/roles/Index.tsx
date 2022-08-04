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
  const refresh = useCallback(() => {
    if (!(currentUser instanceof User)) return;
    currentUser.oso("GET", "facts?predicate=has_role").then(setRoles);
  }, [currentUser]);
  refresh();
  console.log(JSON.stringify(roles));
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
            <td>Resource Type</td>
            <td>Resource Name</td>
          </tr>
        </thead>
        <tbody>
          {roles.map((role) => (
            <tr>
              <td>{role.args[0].id}</td>
              <td>{role.args[1].id}</td>
              <td>{role.args[2].type}</td>
              <td>{role.args[2].id}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};
