export function Fatal(msg: string | Error, status?: number) {
  console.error(msg.toString());
  process.exit(status || 1);
}

