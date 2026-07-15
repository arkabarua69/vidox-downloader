export default function Footer() {
  return (
    <footer className="mt-auto border-t py-5 text-center text-xs" style={{ borderColor: "rgba(255,255,255,0.06)", color: "#5a5a6e" }}>
      <p className="max-w-md mx-auto leading-relaxed">
        All videos are downloaded directly from YouTube CDN.
      </p>
      <p className="mt-1 font-medium" style={{ color: "#8b8b9e" }}>Deploy by <span className="gradient-text">Mac GunJon</span></p>
    </footer>
  );
}
