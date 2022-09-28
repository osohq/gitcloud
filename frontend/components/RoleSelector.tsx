type Props = {
  choices: string[];
  name?: string;
  selected: string;
  update: (value: string) => void;
};


export function RoleSelector({ choices, name, selected, update }: Props) {
  return (
    <select
      id="role"
      name="role"
      className="rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
      defaultValue={selected}
      onChange={({ target: { value } }) => update(value)}
    >
      {choices.map(choice => <option key={choice}>{choice}</option>)}
    </select>
  )
}
