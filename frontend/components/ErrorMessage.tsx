import Link from "next/link";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";

export default function ErrorPage({ error, setError }: { error: Error, setError?: any }) {
  var errorMessage = error.message;
  try {
    const errorJson = JSON.parse(error.message);
    errorMessage = errorJson["message"]
  } catch (e) {
    // do nothing
  }
  return (
    <>
      <div className="bg-white min-h-full px-4 py-16 sm:px-6 sm:py-24 md:grid md:place-items-center lg:px-8">
        <div className="max-w-max mx-auto">
          <main className="sm:flex">
            <p className="text-4xl tracking-tight font-bold text-indigo-600 sm:text-5xl sm:tracking-tight">
              {error.name}
            </p>
            <div className="sm:ml-6">
              <div className="sm:border-l sm:border-gray-200 sm:pl-6">
                <h1 className="text-4xl font-bold text-gray-900 tracking-tight sm:text-5xl sm:tracking-tight">
                  <div className="h-8 w-8 flex text-center">
                    <ExclamationCircleIcon />
                  </div>
                </h1>
                <p className="mt-1 text-base text-gray-500">{errorMessage}</p>
              </div>
              <div className="mt-10 flex space-x-3 sm:border-l sm:border-transparent sm:pl-6">
                {setError &&
                  <button
                    type="button"
                    onClick={(e) => setError(undefined)}
                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Go back
                  </button>
                }
                <Link href="/">
                  <a className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Go home
                  </a>
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
