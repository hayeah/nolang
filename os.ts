import "babel-polyfill";
import * as fs from "fs";
import * as stream from "stream";

export type error = any;

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

export async function Open(file: string, options?: {}): Promise<[Reader, error]> {
  const stream = fs.createReadStream(file, options);
  const err = await waitFSOpen(stream);
  return [new Reader(stream), err] as [Reader, error];
 }

  // Create creates the named file with mode 0666 (before umask), truncating it if it already exists.
export async function Create(file: string, options?: {}): Promise<[Writer, error]> {
  const stream = fs.createWriteStream(file, options);
  const err = await waitFSOpen(stream);
  return [new Writer(stream), err] as [Writer, error];
}

export class Reader {
  private r: stream.Readable;

  Closed = false;
  Err: any = null;

  constructor(r: stream.Readable) {
    this.r = r;

    this.r.on("end", () => {
      this.Closed = true;
    });

    this.r.on("error", (Err) => {
      this.Err = Err;
    });
  }

  // Pipe()

  // Returns null for EOF
  async Read(): Promise<[string, error]> {
    return new Promise<[string, error]>(resolve => {
      if (this.Closed) {
        resolve([this.Err, null])
      }

      this.r.on("readable", () => {
        const chunk = this.r.read();
        resolve([chunk, null]);
      });
    });
  }

  async ReadFull() {
    let all = "";
    while (true) {
      let chunk = await this.Read();
      if (this.Err != null) {
        return "";
      }

      if (this.Closed) {
        break;
      }

      all += chunk;
    }

    return all;
  }
}

export class Writer {
  private r: stream.Writable;

  Closed = false;
  Err: any = null;

  constructor(r: stream.Writable) {
    this.r = r;

    this.r.on("finish", () => {
      this.Closed = true;
    });

    this.r.on("error", (Err) => {
      this.Err = Err;
    });
  }

  async Write(chunk: string): Promise<error> {
    if (this.Err || this.Closed) {
      return;
    }

    return new Promise(done => {
      this.r.write(chunk, () => {
        // This callback will be called regardless of success or error.
        // The error callback is guranteed to be called before the write callback (looking at stream.Writable's code).
        done(this.Err);
      });
    });
  }

}

