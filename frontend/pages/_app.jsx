import "@/styles/globals.css";
import React from "react";
import Head from "next/head";

export default function App({ Component, pageProps }) {
  return (
    <>
    <Head>
      <meta name="Bird Gardens of Naples"/>
      <title>Bird Gardens of Naples</title>
      <link rel="icon" type="image/png" href="/images/favicon.png"></link>
    </Head>
    <div className="App">
      <Component {...pageProps} />
    </div>
    </>
  );
}
