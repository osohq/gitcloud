import "../styles/globals.css";
import type { NextPage } from "next";
import type { AppProps } from "next/app";
import Layout from "../components/Layout";

import { split, HttpLink } from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';

import { ApolloClient, InMemoryCache, ApolloProvider, createHttpLink } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { setContext } from '@apollo/client/link/context';
import { GITCLUB_ROOT } from "../api/common";
import { createClient } from 'graphql-ws';

export type NextPageWithTitle = NextPage & {
  title?: string;
};

type AppPropsWithTitle = AppProps & {
  Component: NextPageWithTitle;
};




const wsLink = () => new GraphQLWsLink(createClient({
  url: GITCLUB_ROOT
    .replace(/http[s]?/, 'ws')
    .replace('5000', '5002') + '/graphql',
}));

const httpLink = createHttpLink({
  uri: GITCLUB_ROOT + "/graphql",
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


// The split function takes three parameters:
//
// * A function that's called for each operation to execute
// * The Link to use for an operation if the function returns a "truthy" value
// * The Link to use for an operation if the function returns a "falsy" value
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return !(
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  authLink.concat(httpLink),
  typeof window !== "undefined" ? wsLink() : undefined,
);


const client = new ApolloClient({
  link: splitLink,
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
