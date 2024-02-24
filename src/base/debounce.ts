/* eslint-disable */
export function debounce<T extends Function>(cb: T, wait = 20) {
  let h;
  const callable = (...args: any) => {
    clearTimeout(h);
    h = setTimeout(() => cb(...args), wait);
  };
  return <T>(<unknown>callable);
}
