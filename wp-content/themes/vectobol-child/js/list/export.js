export function exportCSV(rows) {

  let csv = "Family,Subfamily,Tribe,Genus,Subgenus,Species\n";

  rows.forEach(r => {
    csv += [
      r.family || "",
      r.subfamily || "",
      r.tribe || "",
      r.genus || "",
      r.subgenus || "",
      r.species || ""
    ].map(v =>
      `"${String(v).replace(/"/g,'""')}"`
    ).join(",") + "\n";
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "taxo_filtered.csv";
  a.click();

  URL.revokeObjectURL(url);
}

export function exportPDF(rows) {

  const esc = (s) =>
    String(s || "")
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;");

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
body{font-family:Arial;font-size:12px;margin:20px;}
h3{margin-bottom:5px;}
.source{font-size:11px;color:#555;margin-bottom:10px;}
table{border-collapse:collapse;width:100%;}
th,td{border:1px solid #ccc;padding:4px;text-align:left;}
th{background:#eee;}
i{font-style:italic;}
</style>
</head>
<body>

<h3>Taxonomic list</h3>
<div class="source">Source: VectoBol database</div>

Filtered species (${rows.length})

<table>
<tr>
  <th>Family</th>
  <th>Subfamily</th>
  <th>Tribe</th>
  <th>Taxon</th>
</tr>

${rows.map(r => {

  const genus = r.genus
    ? r.genus.charAt(0).toUpperCase() + r.genus.slice(1).toLowerCase()
    : "";

  const subgenus = r.subgenus
    ? r.subgenus.charAt(0).toUpperCase() + r.subgenus.slice(1).toLowerCase()
    : "";

  const species = r.species ? r.species.toLowerCase() : "";

  let scientific = genus;
  if (subgenus) scientific += ` (${subgenus})`;
  if (species) scientific += ` ${species}`;

  let author = r.author || "";
  let year = r.year || "";

  let auth = "";
  if (author && year) auth = `${author}, ${year}`;
  else if (author) auth = author;
  else if (year) auth = year;

  if ((r.author_parentheses === true || r.author_parentheses === "TRUE") && auth) {
    auth = `(${auth})`;
  }

  return `
  <tr>
    <td>${esc(r.family || "")}</td>
    <td>${esc(r.subfamily || "")}</td>
    <td>${esc(r.tribe || "")}</td>
    <td><i>${esc(scientific)}</i> ${esc(auth)}</td>
  </tr>`;
}).join("")}

</table>

</body>
</html>
`;

  const win = window.open("about:blank", "_blank");

  if (!win) {
    alert("Autorise les popups pour exporter le PDF");
    return;
  }

  win.document.open();
  win.document.write(html);
  win.document.close();

  setTimeout(() => {
    win.focus();
    win.print();
  }, 600);
}