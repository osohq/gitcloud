import "../styles/globals.css";
import type { NextPage } from "next";
import type { AppProps } from "next/app";
import Layout from "../components/Layout";

export type NextPageWithTitle = NextPage & {
  title?: string;
};

type AppPropsWithTitle = AppProps & {
  Component: NextPageWithTitle;
};

function MyApp({ Component, pageProps }: AppPropsWithTitle) {
  const title = Component.title;
  return (
    <Layout title={title}>
      <Component {...pageProps} />
    </Layout>
  );
}

export default MyApp;
