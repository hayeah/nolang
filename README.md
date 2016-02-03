# IO The Golang Way

Promised based IO, with async/await.

Sample code:

```
import * as os from "nolang/os";
import * as io from "nolang/io";

async function generateOutputForExample(file: string) {
  var [r, err] = await os.Open(file);
  exitIfError(err);

  var [src, err] = await io.ReadFull(r);
  exitIfError(err);

  try {
    var tree = parse(src);
  } catch(err) {
    exitIfError(err);
  }


  var [w, err] = await os.Create(file + ".json");
  exitIfError(err);

  w.Write(JSON.stringify(tree, null, 2))

  var err = await w.Close();
  exitIfError(err);
}
```

TypeScript only.