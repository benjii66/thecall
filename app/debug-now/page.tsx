
export default function DebugPage() {
  return (
    <div style={{ padding: "50px", background: "#000", color: "#0f0", fontFamily: "monospace" }}>
      <h1>ENVIRONNEMENT OK</h1>
      <p>Ceci est une nouvelle page. Si tu la vois, le serveur est synchronisé.</p>
      <p>Date: {new Date().toISOString()}</p>
    </div>
  );
}
