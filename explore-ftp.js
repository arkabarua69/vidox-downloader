const ftp = require("basic-ftp");

const combos = [
  { user: "nandinis", pass: "j=T1r&DNg_xg}%Tl" },
  { user: "Vidox2025@nandinisaspire.shop", pass: "j=T1r&DNg_xg}%Tl" },
  { user: "nandinis@nandinisaspire.shop", pass: "j=T1r&DNg_xg}%Tl" },
  { user: "nandinis", pass: "8eMq@h56TVu6T;" },
  { user: "Vidox2025@nandinisaspire.shop", pass: "8eMq@h56TVu6T;" },
];

let i = 0;
async function tryNext() {
  if (i >= combos.length) { console.log("\nAll combos failed."); return; }
  const c = combos[i++];
  const client = new ftp.Client();
  console.log(`\nTrying: ${c.user} / ${c.pass.substring(0,4)}...`);
  try {
    await client.access({
      host: "ftp.nandinisaspire.shop",
      user: c.user,
      password: c.pass,
      port: 21,
      secure: true,
      secureOptions: { rejectUnauthorized: false }
    });
    console.log(`  SUCCESS! Logged in as ${c.user}`);
    try { await client.cd("/home/nandinis"); } catch(e) {}
    console.log("  Dir:", await client.pwd());
    const list = await client.list();
    for (const item of list) {
      console.log(`  ${item.isDirectory ? "DIR " : "FILE"} ${item.name}`);
    }
    client.close();
  } catch (err) {
    console.log(`  FAILED: ${err.message}`);
    client.close();
    tryNext();
  }
}

tryNext();
