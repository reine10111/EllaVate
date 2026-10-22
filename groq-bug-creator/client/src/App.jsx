import { useState } from "react";
import axios from "axios";

function App() {
  const [feature, setFeature] = useState("");
  const [bugReport, setBugReport] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!feature.trim()) return alert("Please enter a feature name 💜");
    setLoading(true);
    setBugReport("");
    try {
      const res = await axios.post("http://localhost:3001/api/generate-bug", { feature });
      setBugReport(res.data.bugReport);
    } catch {
      setBugReport("❌ Oops! Can't reach the server. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <span className="float f1">✨</span>
      <span className="float f2">💜</span>
      <span className="float f3">🦋</span>
      <span className="float f4">🌸</span>

      <div className="card">
        <h1 className="title">🐞 EllaVate Bug Buddy</h1>
        <p className="subtitle">Tell me a feature and I'll find the bugs for you ✨</p>

        <input
          className="input"
          type="text"
          placeholder="Enter feature (e.g. Login form) 💜"
          value={feature}
          onChange={(e) => setFeature(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
        />

        <button className="btn" onClick={handleGenerate} disabled={loading}>
          {loading ? "Sprinkling magic... ✨" : "Generate Bug 💖"}
        </button>

        {bugReport && <pre className="report">{bugReport}</pre>}
      </div>
    </div>
  );
}

export default App;