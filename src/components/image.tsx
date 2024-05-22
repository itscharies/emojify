import React from "react";

export function Image({ src }: { src?: string }) {
  return (
    <img
      src={src}
      style={{
        backgroundImage:
          "linear-gradient(45deg, #808080 25%, transparent 25%), linear-gradient(-45deg, #808080 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #808080 75%), linear-gradient(-45deg, transparent 75%, #808080 75%)",
        backgroundSize: "32px 32px",
        backgroundPosition: "0 0, 0 16px, 16px -16px, -16px 0px",
      }}
    />
  );
}
