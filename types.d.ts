declare module '*.scss' {
  interface IClassNames {
    [className: string]: string
  }
  const styles: IClassNames;
  export = styles;
}