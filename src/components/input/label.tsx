import React from "react";
import { FieldContext } from "./field";
import { Text } from "../typography/text";

export function Label({ children }: React.PropsWithChildren) {
  return (
    <FieldContext.Consumer>
      {(id) => {
        return (
          <label htmlFor={id}>
            <Text weight="bold">{children}</Text>
          </label>
        );
      }}
    </FieldContext.Consumer>
  );
}
