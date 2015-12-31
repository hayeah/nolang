import "babel-polyfill";

import * as log from "./log";
import * as os from "./os";

// class TestWriteStream extends stream.Writable {
//   n = 0;

//   _write(chunk, encoding, cb) {
//     this.n++;
//     if (this.n % 2 == 0) {
//       cb("boom!");
//     } else {
//       cb();
//     }
//   }
// }

async function main() {

  let file = "build/index.js";

  console.log("read", file);
  var [r, err] = await os.Open(file);
  err && log.Fatal(err);

  var [w, err] = await os.Create("cmd-cp-result.js");
  err && log.Fatal(err);

  while (true) {
    var [chunk, err] = await r.Read();
    err && log.Fatal(err);

    if (chunk === null) {
      break;
    }

    var err = await w.Write(chunk)
    err && log.Fatal(err);
  }


  // let content = await r.ReadFull();
  // r.Err && log.Fatal(r.Err);

};

main();
