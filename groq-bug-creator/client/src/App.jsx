import { useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  TextRun, WidthType, BorderStyle, ShadingType, HeadingLevel,
} from "docx";

const HEADERS = ["Action", "Data", "Expected Result", "Actual Result"];

const isFailed = (s) => String(s.status).toLowerCase().startsWith("fail");
const actualText = (s) =>
  isFailed(s) ? `Failed: ${s.actual || ""}`.trim() : "Passed";

const fileName = (report, ext) =>
  `${(report.title || "bug-report").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.${ext}`;

function saveBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

/* ---------- PDF ---------- */
function downloadPdf(report) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

  doc.setFontSize(18);
  doc.setTextColor(76, 29, 149);
  doc.text(report.title || "Bug Report", 40, 50, { maxWidth: 760 });

  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  let y = 75;
  const lines = [
    ["Severity", report.severity],
    ["Environment", report.environment],
    ["Description", report.description],
  ];
  lines.forEach(([label, value]) => {
    const text = doc.splitTextToSize(`${label}: ${value || "-"}`, 760);
    doc.text(text, 40, y);
    y += text.length * 13 + 4;
  });

  autoTable(doc, {
    startY: y + 8,
    head: [HEADERS],
    body: (report.steps || []).map((s) => [s.action, s.data, s.expected, actualText(s)]),
    styles: { fontSize: 9, cellPadding: 6, valign: "top" },
    headStyles: { fillColor: [124, 58, 237], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 243, 255] },
    didParseCell: (d) => {
      if (d.section === "body" && d.column.index === 3) {
        const failed = String(d.cell.raw).startsWith("Failed");
        d.cell.styles.textColor = failed ? [220, 38, 38] : [22, 163, 74];
        d.cell.styles.fontStyle = "bold";
      }
    },
  });

  doc.save(fileName(report, "pdf"));
}

/* ---------- Word ---------- */
const border = { style: BorderStyle.SINGLE, size: 4, color: "C4B5FD" };
const borders = { top: border, bottom: border, left: border, right: border };
const COL_WIDTHS = [2200, 2000, 2400, 2760]; // total 9360

function docCell(width, children, fill) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders,
    shading: fill ? { type: ShadingType.CLEAR, fill, color: "auto" } : undefined,
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    children,
  });
}

const plain = (text, opts = {}) =>
  new Paragraph({ children: [new TextRun({ text: String(text || "-"), ...opts })] });

async function downloadDocx(report) {
  const headerRow = new TableRow({
    tableHeader: true,
    children: HEADERS.map((h, i) =>
      docCell(COL_WIDTHS[i], [plain(h, { bold: true, color: "FFFFFF" })], "7C3AED")
    ),
  });

  const rows = (report.steps || []).map((s) => {
    const failed = isFailed(s);
    const actualCell = new Paragraph({
      children: failed
        ? [
            new TextRun({ text: "Failed: ", bold: true, color: "DC2626" }),
            new TextRun({ text: s.actual || "" }),
          ]
        : [new TextRun({ text: "Passed", bold: true, color: "16A34A" })],
    });
    return new TableRow({
      children: [
        docCell(COL_WIDTHS[0], [plain(s.action)]),
        docCell(COL_WIDTHS[1], [plain(s.data)]),
        docCell(COL_WIDTHS[2], [plain(s.expected)]),
        docCell(COL_WIDTHS[3], [actualCell]),
      ],
    });
  });

  const doc = new Document({
    styles: { default: { document: { run: { font: "Arial", size: 22 } } } },
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun({ text: report.title || "Bug Report", color: "4C1D95" })],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Severity: ", bold: true }),
              new TextRun({ text: report.severity || "-" }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Environment: ", bold: true }),
              new TextRun({ text: report.environment || "-" }),
            ],
          }),
          new Paragraph({
            spacing: { after: 240 },
            children: [
              new TextRun({ text: "Description: ", bold: true }),
              new TextRun({ text: report.description || "-" }),
            ],
          }),
          new Table({
            width: { size: 9360, type: WidthType.DXA },
            columnWidths: COL_WIDTHS,
            rows: [headerRow, ...rows],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveBlob(blob, fileName(report, "docx"));
}

/* ---------- App ---------- */
function App() {
  const [feature, setFeature] = useState("");
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!feature.trim()) return alert("Please enter a feature name 💜");
    setLoading(true);
    setReport(null);
    setError("");
    try {
      const res = await axios.post("http://localhost:3001/api/generate-bug", { feature });
      setReport(res.data.report);
    } catch {
      setError("❌ Oops! Something went wrong. Check that the backend is running, then try again.");
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
          placeholder="Enter feature (e.g. Call History date filter) 💜"
          value={feature}
          onChange={(e) => setFeature(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
        />

        <button className="btn" onClick={handleGenerate} disabled={loading}>
          {loading ? "Sprinkling magic... ✨" : "Generate Bug 💖"}
        </button>

        {error && <div className="error-box">{error}</div>}

        {report && (
          <div className="report-wrap">
            <h2 className="report-title">{report.title}</h2>

            <div className="meta">
              <span className={`badge sev-${String(report.severity).toLowerCase()}`}>
                {report.severity}
              </span>
              <span className="meta-text">🖥️ {report.environment}</span>
            </div>
            <p className="desc">{report.description}</p>

            <div className="table-scroll">
              <table className="bug-table">
                <thead>
                  <tr>
                    {HEADERS.map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(report.steps || []).map((s, i) => (
                    <tr key={i}>
                      <td>{s.action}</td>
                      <td>{s.data}</td>
                      <td>{s.expected}</td>
                      <td>
                        {isFailed(s) ? (
                          <>
                            <strong className="failed">Failed:</strong> {s.actual}
                          </>
                        ) : (
                          <strong className="passed">Passed</strong>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="download-row">
              <button className="btn-outline" onClick={() => downloadDocx(report)}>
                📄 Download Word
              </button>
              <button className="btn-outline" onClick={() => downloadPdf(report)}>
                📕 Download PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;