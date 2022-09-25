import Image from "next/image";
import Link from "next/link";
import BearCabinet from "../images/bear-cabinet.png";
import useUser from "../lib/useUser";

export default function Home() {
  const {
    currentUser: { isLoggedIn },
  } = useUser();
  return (
    <div className="pt-10">
      <div className="mx-auto max-w-md px-4 sm:max-w-3xl sm:px-6 lg:px-8 lg:max-w-7xl lg:grid lg:grid-cols-2 lg:gap-24">
        <div>
          <div className="mt-20">
            <div className="mt-6 sm:max-w-xl">
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight sm:text-5xl sm:tracking-tight">
                Welcome to GitCloud
              </h1>
              <p className="mt-6 text-xl text-gray-500">
                Anim aute id magna aliqua ad ad non deserunt sunt. Qui irure
                qui lorem cupidatat commodo.
              </p>
            </div>
            <Link href={isLoggedIn ? "/orgs" : "/login"}>
              <div className="mt-4">
                <button className="block w-full rounded-md border border-transparent px-5 py-3 bg-rose-500 text-base font-medium text-white shadow hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 sm:px-10">
                  Get Started
                </button>
              </div>
            </Link>
          </div>
        </div>
      </div>

      <div className="sm:mx-auto sm:max-w-3xl sm:px-6">
        <div className="sm:relative sm:mt-12  sm:py-4 lg:absolute lg:inset-y-4 lg:right-4 lg:w-1/2">
          <div className="pl-4 -mr-40 sm:mx-auto sm:max-w-3xl sm:px-0 lg:max-w-none lg:h-full lg:pl-12">
            <Image
              src={BearCabinet}
              alt="Bear putting code in a file cabinet"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
