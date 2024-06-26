import React, { Suspense } from "react";
import { Toaster } from "react-hot-toast";
import { Title } from "./components/typography/title";
import { Text } from "./components/typography/text";
import { Divider } from "./components/divider";
import { RandomEmoji } from "./components/random_emoji";

const Editor = React.lazy(() => import("./editor/editor"));

export function App() {
  return (
    <div className="max-w-screen-lg w-full h-full p-6 flex flex-col gap-6 m-auto">
      <header>
        <Title level={1}>
          Emojify <RandomEmoji />
        </Title>
      </header>
      <main className="grow flex flex-col">
        <Suspense fallback={<></>}>
          <Editor />
        </Suspense>
      </main>
      <Divider />
      <footer>
        <Text>
          Made with <RandomEmoji /> by Caleb
        </Text>
      </footer>
      <Toaster position="top-center" />
    </div>
  );
}
