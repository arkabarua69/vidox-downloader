const net = require("net");

const host = "ftp.nandinisaspire.shop";
const user = "Vidox2025@nandinisaspire.shop";
const pass = "j=T1r&DNg_xg}%Tl";
const port = 21;

const socket = net.connect({ host, port }, () => {
  console.log("TCP connected");
});
socket.setEncoding("utf-8");

let buffer = "";
let step = 0;

socket.on("data", (data) => {
  buffer += data;
  const lines = buffer.split("\r\n");
  buffer = lines.pop();
  for (const line of lines) {
    if (!line) continue;
    console.log("<--", line);
    const code = parseInt(line);
    if (code === 220) {
      console.log("--> AUTH TLS");
      socket.write("AUTH TLS\r\n");
    } else if (code === 234) {
      // Now upgrade to TLS manually
      const tls = require("tls");
      const tlsSock = tls.connect({ socket: socket, rejectUnauthorized: false }, () => {
        console.log("TLS upgraded");
        tlsSock.write("USER " + user + "\r\n");
        console.log("--> USER " + user);
      });
      tlsSock.setEncoding("utf-8");
      let tbuf = "";
      tlsSock.on("data", (d) => {
        tbuf += d;
        const tl = tbuf.split("\r\n");
        tbuf = tl.pop();
        for (const t of tl) {
          if (!t) continue;
          console.log("<-- TLS:", t);
          const tc = parseInt(t);
          if (tc === 331) {
            const cmd = "PASS " + pass + "\r\n";
            console.log("--> PASS (raw):", Buffer.from(cmd).toString("hex"));
            tlsSock.write(cmd);
          } else if (tc === 230) {
            console.log("\n=== LOGIN SUCCESS ===");
            tlsSock.write("PWD\r\n");
          } else if (tc === 257) {
            console.log("Dir:", t);
            tlsSock.write("CWD /home/nandinis\r\n");
          } else if (tc === 250) {
            tlsSock.write("PWD\r\n");
          } else if (tc === 530) {
            console.log("AUTH FAILED");
            tlsSock.write("QUIT\r\n");
          }
        }
      });
      tlsSock.on("error", (e) => console.error("TLS err:", e.message));
      tlsSock.on("close", () => { socket.destroy(); });
      return; // stop handling plain socket data
    }
  }
});

socket.on("error", (err) => console.error("Error:", err.message));
socket.on("close", () => console.log("Closed"));
setTimeout(() => { socket.destroy(); }, 20000);
