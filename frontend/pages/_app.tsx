import "../styles/globals.css";
import type { NextPage } from "next";
import type { AppProps } from "next/app";
import Layout from "../components/Layout";

import { ApolloClient, InMemoryCache, ApolloProvider, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';


export type NextPageWithTitle = NextPage & {
  title?: string;
};

type AppPropsWithTitle = AppProps & {
  Component: NextPageWithTitle;
};

const httpLink = createHttpLink({
  // uri: GITCLUB_ROOT + "/graphql",
  uri: 'http://localhost:4000/',
  credentials: 'include'
});

const authLink = setContext((_, { headers }) => {
  // get the authentication token from local storage if it exists
  // const { userId, currentUser } = useUser();
  const username = typeof window !== "undefined" ? localStorage.getItem("username") : undefined;
  // return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      ...(username && { 'x-user-id': username }),
    }
  }
});


const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache()
});

function MyApp({ Component, pageProps }: AppPropsWithTitle) {
  return (
    <ApolloProvider client={client} >
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </ApolloProvider >
  );
}

export default MyApp;
