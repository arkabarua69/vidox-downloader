const Client = require("ftp");

const hosts = [
  "ftp.nandinisaspire.shop",
  "nandinisaspire.shop",
  "b201.serverdiana.com",
];

const users = [
  "vidox@nandinisaspire.shop",
  "nandinis",
  "nandinis@nandinisaspire.shop",
];

const passwords = [
  "q^IH=YeV@Zls6xO",
  "0a$NJBHa#,^f;psp",
  "~OQJ{zMF#Skk{=?S",
];

let combos = [];
for (const h of hosts) {
  for (const u of users) {
    for (const p of passwords) {
      combos.push({ host: h, user: u, pass: p });
    }
  }
}

let i = 0;
function tryNext() {
  if (i >= combos.length) { console.log("\nAll combos exhausted."); return; }
  const c = combos[i++];
  const label = `${c.host} / ${c.user} / ${c.pass.substring(0,3)}...`;
  process.stdout.write(`${i}/${combos.length} ${label} ... `);
  const cl = new Client();
  cl.on("ready", () => {
    console.log("SUCCESS!");
    cl.pwd((err, cwd) => { console.log("  Dir:", cwd); cl.end(); tryNext(); });
  });
  cl.on("error", () => { console.log("FAIL"); cl.end(); tryNext(); });
  cl.connect({ host: c.host, user: c.user, password: c.pass, port: 21, secure: true, secureOptions: { rejectUnauthorized: false }, connTimeout: 5000 });
}

tryNext();
