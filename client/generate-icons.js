const { createCanvas } = require("canvas");
const fs = require("fs");
const path = require("path");

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  const r = size * 0.2;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(size - r, 0);
  ctx.quadraticCurveTo(size, 0, size, r);
  ctx.lineTo(size, size - r);
  ctx.quadraticCurveTo(size, size, size - r, size);
  ctx.lineTo(r, size);
  ctx.quadraticCurveTo(0, size, 0, size - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();

  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, "#e63946");
  grad.addColorStop(1, "#ff6b6b");
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.beginPath();
  const cx = size * 0.42, cy = size * 0.5;
  const triSize = size * 0.32;
  ctx.moveTo(cx - triSize * 0.35, cy - triSize * 0.5);
  ctx.lineTo(cx - triSize * 0.35, cy + triSize * 0.5);
  ctx.lineTo(cx + triSize * 0.5, cy);
  ctx.closePath();
  ctx.fillStyle = "white";
  ctx.fill();

  return canvas.toBuffer("image/png");
}

try {
  fs.writeFileSync(path.join(__dirname, "public", "pwa-192.png"), generateIcon(192));
  fs.writeFileSync(path.join(__dirname, "public", "pwa-512.png"), generateIcon(512));
  console.log("Icons generated!");
} catch(e) {
  console.log("Canvas not available, using SVG fallback");
  fs.writeFileSync(path.join(__dirname, "public", "pwa-192.png"), fs.readFileSync(path.join(__dirname, "public", "favicon.svg")));
  fs.writeFileSync(path.join(__dirname, "public", "pwa-512.png"), fs.readFileSync(path.join(__dirname, "public", "favicon.svg")));
}
