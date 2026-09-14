// src/pages/_app.tsx
import { ApolloProvider } from "@apollo/client";
import { ConfigProvider, App } from "antd";
import "antd/dist/reset.css";
import dayjs from "dayjs";
import "dayjs/locale/en";
import type { AppProps } from "next/app";
import { useEffect } from "react";
import { ModalProvider } from "react-modal-hook";
import { SessionProvider } from "next-auth/react";
import apolloClient from "../lib/apolloClient";
import RouteLoadingBar from "../components/layout/RouteLoadingBar";
import "../styles/globals.css";
dayjs.locale("en");

// Suppress hydration warnings immediately (before React loads)
if (typeof window !== "undefined") {
  const originalError = console.error;
  console.error = (...args) => {
    if (
      typeof args[0] === "string" &&
      (args[0].includes("Hydration") ||
        args[0].includes("hydrated") ||
        args[0].includes("A tree hydrated") ||
        args[0].includes("did not match") ||
        args[0].includes("css-dev-only-do-not-override"))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
}

export default function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  useEffect(() => {
    // Suppress development warnings
    const originalError = console.error;
    const originalWarn = console.warn;

    console.error = (...args) => {
      if (
        typeof args[0] === "string" &&
        (args[0].includes("Hydration") ||
          args[0].includes("hydrated") ||
          args[0].includes("A tree hydrated") ||
          args[0].includes("did not match"))
      ) {
        return;
      }
      originalError.call(console, ...args);
    };

    console.warn = (...args) => {
      if (
        typeof args[0] === "string" &&
        (args[0].includes("[antd: compatible]") ||
          args[0].includes("React is 16 ~ 18"))
      ) {
        return;
      }
      originalWarn.call(console, ...args);
    };

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  return (
    <SessionProvider session={session}>
      <RouteLoadingBar />
      <ApolloProvider client={apolloClient}>
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: "#1E3A8A",
            },
          }}
          locale={{ locale: "en" }}
        >
          <App>
            <ModalProvider>
              <Component {...pageProps} />
            </ModalProvider>
          </App>
        </ConfigProvider>
      </ApolloProvider>
    </SessionProvider>
  );
}
