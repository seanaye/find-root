import { err, ok, ResultAsync } from "https://esm.sh/neverthrow@5.0.0";

function read(file: string | URL) {
  return ResultAsync<string, Error>.fromPromise(
    Deno.readTextFile(file),
    (e) => e as Error,
  );
}
export async function* walkUpwards(start: URL) {
  const root = new URL("file:///");
  let cur = start;
  while (root.toString() !== cur.toString()) {
    yield cur;
    cur = new URL("../", cur);
  }
}

export async function getRoot(filename: string, start: URL) {
  for await (const dir of walkUpwards(start)) {
    const fileUrl = new URL(filename, dir);
    const res = await read(fileUrl);
    if (res.isOk()) {
      return ok({ inDir: dir, value: res.value });
    }
  }
  return err(new Error("Could not find root file"));
}
