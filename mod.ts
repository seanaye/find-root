import { err, ok, ResultAsync } from "https://esm.sh/neverthrow@5.0.0";
import {
  filter,
  fromPromise,
  make,
  map,
  mergeMap,
  onPush,
  pipe,
  take,
  toPromise,
} from "https://esm.sh/wonka@4.0.15";

async function read(file: string | URL) {
  return await ResultAsync<string, Error>.fromPromise(
    Deno.readTextFile(file),
    (e) => e as Error,
  );
}

/** Async iterator which walks up the filesystem starting at start URL ending at root */
export function* walkUpwards(start: URL) {
  const root = new URL("file:///");
  let cur = start;
  while (root.toString() !== cur.toString()) {
    yield cur;
    cur = new URL("../", cur);
  }
}
/** Returns walk upwards as a source */
function walkUpwardsSource(start: URL) {
  return make<URL>(({ next, complete }) => {
    const iterable = walkUpwards(start);
    mapIter(iterable, next, complete);
    return () => {};
  });
}

/** Use map on async generator */
function mapIter<T>(
  iterable: Iterable<T>,
  callback: (val: T) => void,
  onEnd?: () => void,
) {
  for (const val of iterable) {
    callback(val);
  }
  onEnd?.();
}

export async function getRoot(filename: string, start: URL) {
  return await pipe(
    walkUpwardsSource(start),
    map((dir) => new URL(filename, dir)),
    map(read),
    mergeMap(fromPromise),
    filter((x) => x.isOk()),
    toPromise,
  );
}

if (import.meta.main) {
  const thisUrl = new URL("./", import.meta.url);
  const out = await getRoot("deno.jsonc", thisUrl);
  console.log(out);
}
