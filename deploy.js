const ftp = require("basic-ftp");
const path = require("path");
const fs = require("fs");

const HOST = "ftp.nandinisaspire.shop";
const USER = "vidox@nandinisaspire.shop";
const PASSWORD = "~OQJ{zMF#Skk{=?S";
const PORT = 21;
const ROOT_DIR = path.join(__dirname);

const UPLOAD_DIRS = [
  "server",
  path.join("client", "dist"),
];

const UPLOAD_FILES = [
  "package.json",
  "package-lock.json",
];

const SKIP_DIRS = ["node_modules", "bin-win"];

async function uploadDir(client, localDir, remoteDir) {
  await client.ensureDir(remoteDir);
  await client.clearWorkingDir();
  const entries = fs.readdirSync(localDir, { withFileTypes: true });
  for (const entry of entries) {
    const localPath = path.join(localDir, entry.name);
    const remotePath = remoteDir + "/" + entry.name;
    if (entry.isDirectory()) {
      if (SKIP_DIRS.includes(entry.name)) continue;
      console.log(`  [DIR] ${remotePath}`);
      await client.ensureDir(remotePath);
      await uploadDir(client, localPath, remotePath);
    } else {
      console.log(`  [FILE] ${remotePath}`);
      await client.uploadFrom(localPath, remotePath);
    }
  }
}

async function main() {
  const client = new ftp.Client();
  client.ftp.verbose = true;

  try {
    await client.access({ host: HOST, user: USER, password: PASSWORD, port: PORT });
    console.log("Connected!");
    console.log("Current dir:", await client.pwd());

    // List root to see structure
    const list = await client.list();
    console.log("\nRoot directory contents:");
    for (const item of list) {
      console.log(`  ${item.isDirectory ? "DIR " : "FILE"} ${item.name}`);
    }

    // Upload server directory
    console.log("\n--- Uploading server/ ---");
    const serverLocal = path.join(ROOT_DIR, "server");
    await uploadDir(client, serverLocal, "server");

    // Upload client/dist directory
    console.log("\n--- Uploading client/dist/ ---");
    const distLocal = path.join(ROOT_DIR, "client", "dist");
    await client.ensureDir("client/dist");
    await uploadDir(client, distLocal, "client/dist");

    // Upload root package files
    console.log("\n--- Uploading root package files ---");
    for (const file of UPLOAD_FILES) {
      const localPath = path.join(ROOT_DIR, file);
      if (fs.existsSync(localPath)) {
        await client.uploadFrom(localPath, file);
        console.log(`  [FILE] ${file}`);
      }
    }

    console.log("\nDeployment complete!");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    client.close();
  }
}

main();
