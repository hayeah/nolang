import * as fs from "fs";
import * as stream from "stream";

import {error} from "./types";

export type Chunk = string | Buffer;

interface Reader {
  Read(): Promise<[Buffer, error]>;
}

interface Writer {
  Write(chunk: Chunk): Promise<error>;
}

interface Closer {
  Close(): Promise<error>;
}

export const EOF = new Error("EOF");



// interface Closer {
//   Close(): Promise<error>;
// }

// Not knowing whether it's going to return Buffer or string is annoying...
// Use buffer by default. wth.

// You know what? this is pretty insane. I wonder if I could simply interface with the native read stream.
export class StreamReader implements Reader {
  private stream: stream.Readable;

  private currentReadResolve: (chunk: [Buffer, error]) => void = null;
  private currentRead: Promise<[Buffer, error]> = null;

  private closed = false;
  private err: any = null;

  // Wait for client to invoke Read.
  private pendingRead: Promise<{}>;
  private pendingReadResolve: () => void;

  constructor(stream: stream.Readable) {
    // throw a hissy fit if an encoding is used...
    this.stream = stream;

    this.stream.on("readable", async () => {
      // should only try to read where Read is called..
      await this.pendingRead;

      const chunk: Buffer = this.stream.read();
      // console.log("stream.read",chunk);

      if (chunk == null) {
        // Not enough data. Wait for next readable event.
        // We also get null for EOF. In which case, let `end` event resolve to read.
        return;
      }

      // read -> chunk
      // read -> null
      // stream -> end

      this.resolveRead(chunk,null);
    });

    this.stream.on("error", (err) => {
      // console.log("stream error",err);

      this.err = err;
      this.resolveRead(null,err)
    });

    this.stream.on("end", () => {
      // console.log("stream end");
      this.closed = true;

      this.resolveRead(null,EOF);
    });

    this.createPendingRead();
  }

  private resolveRead(chunk: Buffer, error: error) {
    // debugger;
    if(this.currentRead == null) {
      return;
    }

    this.currentRead = null;
    let resolve = this.currentReadResolve;
    resolve(<[Buffer, error]>[chunk, error]);

    if(!this.closed) {
      this.createPendingRead();
    }
  }

  private createPendingRead() {
    this.pendingRead = new Promise(resolve => {
      this.pendingReadResolve = resolve;
    });
  }

  private triggerPendingRead() {
    this.pendingReadResolve();
  }

  async Read(): Promise<[Buffer, error]> {
    let readPromise = new Promise<[Buffer, error]>(async (resolve) => {
      // Serialize reads
      while (true) {
        if (this.currentRead == null) {
          break;
        }

        await this.currentRead;
      }

      if (this.closed) {
        resolve(<[Buffer, error]>[null, EOF]);
        return;
      }

      if (this.err) {
        resolve(<[Buffer, error]>[null, this.err]);
        return;
      }

      // ensure that we capture readPromise after it's set...
      process.nextTick(() => {
        // debugger;

        this.currentRead = readPromise;
        this.currentReadResolve = resolve;
        this.triggerPendingRead();
      });
    });

    return readPromise;
  }
}

export class StreamWriter implements Writer, Closer {
  private stream: stream.Writable;

  private closed = false;
  private err: any = null;

  constructor(stream: stream.Writable) {
    // throw a hissy fit if an encoding is used...
    this.stream = stream;

    this.stream.on("finish", () => {
      this.closed = true;
    });

    this.stream.on("error", (Err) => {
      this.err = Err;
    });
  }

  async Write(chunk: Chunk): Promise<error> {
    if (this.err || this.closed) {
      return;
    }

    return new Promise<error>(done => {
      this.stream.write(chunk, () => {
        // This callback will be called regardless of success or error.
        // The error callback is guranteed to be called before the write callback (looking at stream.Writable's code).
        done(this.err);
      });
    });
  }

  async Close(): Promise<error> {
    if(this.closed) {
      return;
    }

    if(this.err) {
      return this.err;
    }

    return new Promise<error>(resolve => {
      this.stream.once("finish",() => {
        resolve(this.err);
      });
    });
  }
}

export class StreamReadWriteCloser implements Reader, Writer, Closer {
  private w: StreamWriter;
  private r: StreamReader;

  constructor(stream: stream.Readable & stream.Writable) {
    this.w = new StreamWriter(stream);
    this.r = new StreamReader(stream);
  }

  async Write(chunk: Chunk): Promise<error> {
    return this.w.Write(chunk);
  }

  async Read(): Promise<[Buffer, error]> {
    return this.r.Read();
  }

  async Close(): Promise<error> {
    return this.w.Close();
  }
}



import {StringDecoder,NodeStringDecoder} from "string_decoder";

export async function ReadFull(r: Reader, encoding: string = "utf8"): Promise<[string, error]> {
  let all = "";

  // let all = new Buffer();
  let decoder = new StringDecoder(encoding);

  while (true) {
    let [chunk, err] = await r.Read();

    // console.log("chunk", chunk, err);
    if (err === EOF) {
      break;
    }

    if (err) {
      return <[string, error]>["", err];
    }

    all += decoder.write(chunk);

    // console.log("all", all);
  }

  // console.log("done read all");


  // end method not in node.d.ts
  all += (<any>decoder).end();

  return <[string, error]>[all, null];
}

// function SplitBytes() {

// }

// class BufferSplitter {
// }

// class StringSplitter {
//   private buf: string = "";
//   private r: Reader;
//   private decoder: NodeStringDecoder;

//   //

//   constructor(r: Reader, encoding = "utf8") {
//     this.r = r;
//     this.decoder = new StringDecoder(encoding);
//   }

//   async Next(delimiter: RegExp): Promise<[string,error]> {
//     while(true) {
//       if(this.buf == "") {
//         let [chunk,err] = await this.r.Read();
//         this.buf += this.decoder.write(chunk);


//       }


//     }


//     let start = piece.indexOf(delimiter);
//     if(start != -1) {
//       let end = start + delimiter.length;
//       let beforeDelimiter = piece.slice(0,start);
//       let afterDelimiter = piece.slice(end);

//       let

//     }
//   }
// }

// async () => {
//   let splitter = r.Split("\n")

//   await splitter.Next();

//   await splitter.Each(line => {

//   });

//   let lines = await splitter.Map(line => {

//   });




//   // for(let line of ) {
//   //   let line = await line;
//   // }
// }




