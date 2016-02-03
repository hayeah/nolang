import * as fs from "fs";
// import * as stream from "stream";

import * as io from "./io";

import {error} from "./types";

async function waitFSOpen(stream: fs.ReadStream | fs.WriteStream): Promise<error> {
  return new Promise<error>(done => {
    function onError(err) {
      done(err);
    }

    stream.once("error", onError);

    stream.once("open", () => {
      stream.removeListener("error", onError);
      done(null);
    });
  });
}

export async function Open(file: string, options?: {}): Promise<[io.StreamReader, error]> {
  const stream = fs.createReadStream(file, options);
  const err = await waitFSOpen(stream);
  return [new io.StreamReader(stream), err] as [io.StreamReader, error];
}

// Create creates the named file with mode 0666 (before umask), truncating it if it already exists.
export async function Create(file: string, options?: {}): Promise<[io.StreamWriter, error]> {
  const stream = fs.createWriteStream(file, options);
  const err = await waitFSOpen(stream);
  return [new io.StreamWriter(stream), err] as [io.StreamWriter, error];
}
