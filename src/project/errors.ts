export function fault(code: string, message: string, target?: string) {
  return Object.assign(new Error(message), { code, target });
}
