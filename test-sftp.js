const { Client } = require("ssh2");

const combos = [
  { user: "nandinis", pass: "j=T1r&DNg_xg}%Tl", port: 22 },
  { user: "nandinis", pass: "j=T1r&DNg_xg}%Tl", port: 55244 },
  { user: "Vidox2025@nandinisaspire.shop", pass: "j=T1r&DNg_xg}%Tl", port: 22 },
  { user: "Vidox2025@nandinisaspire.shop", pass: "j=T1r&DNg_xg}%Tl", port: 55244 },
];

let i = 0;
function tryNext() {
  if (i >= combos.length) { console.log("\nAll combos failed."); return; }
  const c = combos[i++];
  console.log(`\nTrying: ${c.user} port ${c.port}...`);
  const conn = new Client();
  const timer = setTimeout(() => { console.log("  TIMEOUT"); conn.end(); tryNext(); }, 10000);
  conn.on("ready", () => {
    clearTimeout(timer);
    console.log("  SSH connected!");
    conn.sftp((err, sftp) => {
      if (err) { console.error("  SFTP error:", err.message); conn.end(); tryNext(); return; }
      sftp.readdir(".", (err, list) => {
        if (err) console.error("  Readdir error:", err.message);
        else {
          console.log("  SUCCESS! Directory listing:");
          for (const item of list) {
            const isDir = (item.attrs.mode & 0o40000) !== 0;
            console.log(`    ${isDir ? "DIR " : "FILE"} ${item.filename}`);
          }
        }
        conn.end();
      });
    });
  });
  conn.on("error", (err) => {
    clearTimeout(timer);
    console.log(`  FAILED: ${err.message}`);
    tryNext();
  });
  conn.connect({ host: "ftp.nandinisaspire.shop", port: c.port, username: c.user, password: c.pass });
}

tryNext();
