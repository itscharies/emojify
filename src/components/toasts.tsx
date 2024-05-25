import React from "react";
import { Text } from './typography/text'

export function Toast({ message }: { message: string }) {
  return <div className="p-4 bg-slate-900 border border-slate-700 rounded-md">
    <Text>{message}</Text>
  </div>
};
