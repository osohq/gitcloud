import { ChangeEvent, useContext } from "react";
import useUser from "../lib/useUser";

type Props = {
  choices: string[];
  name?: string;
  selected: string;
  update: (e: ChangeEvent<HTMLSelectElement>) => void;
};

export function RoleSelector({ choices, name, selected, update }: Props) {
  const { currentUser: { isLoggedIn } } = useUser();

  return (
    <select
      disabled={!isLoggedIn || !choices.length}
      name={name || "role"}
      value={selected}
      onChange={update}
    >
      {choices.map((r) => (
        <option key={r} value={r}>
          {r}
        </option>
      ))}
    </select>
  );
}
