const fs = require("fs");

export function parseLatestReadmeNotes() {
  let readme = fs.readFileSync("README.md", "utf8");

  let notes = readme.split("## 🕣 Development History")[1];
}
