const el = id => document.getElementById(id);
function show(value) { el("result").textContent = value; }
function appendText(value) {
  const p = document.createElement("p"); p.textContent = value; el("result").append(p);
}
function action(callback) {
  const button = el("run");
  button.onclick = async () => {
    button.disabled = true;
    try { await callback(); } catch (error) { show(error.message); }
    finally { button.disabled = false; }
  };
}
function renderTable(rows) {
  const wrapper = document.createElement("div"), table = document.createElement("table");
  wrapper.className = "grid";
  rows.forEach((row,index) => {
    const tr = table.insertRow();
    row.forEach(value => {
      const cell = document.createElement(index ? "td" : "th");
      cell.textContent = String(value);
      if (!index) cell.scope = "col";
      tr.append(cell);
    });
  });
  wrapper.append(table); el("result").append(wrapper);
}
let previousUrl;
function download(filename, contents, type = "text/csv") {
  if (previousUrl) URL.revokeObjectURL(previousUrl);
  previousUrl = URL.createObjectURL(new Blob([contents],{type}));
  const link = document.createElement("a");
  link.className = "download"; link.href = previousUrl;
  link.download = filename; link.textContent = "Download " + filename;
  el("result").append(link);
}
import {pivot,parseCsv,encodeCsv} from "./tool.mjs";
function columns() {
  let headers = [];
  try { headers = parseCsv(el("csv").value).header; } catch {}
  for (const [index,id] of ["row","column","value"].entries()) {
    const s = el(id), old = s.value; s.replaceChildren();
    for (const name of headers) s.add(new Option(name,name));
    if (headers.includes(old)) s.value = old;
    else if (headers.length) s.selectedIndex = Math.min(index,headers.length-1);
  }
}
el("csv").oninput = columns;
el("mode").onchange = () => { el("value").disabled = el("mode").value === "count"; };
el("example").onclick = () => { el("csv").value = "Region,Product,Units\nNorth,Tea,8\nNorth,Coffee,4\nSouth,Tea,6\nSouth,Coffee,9\nNorth,Tea,2"; columns(); };
action(() => {
  const output = pivot(el("csv").value,el("row").value,el("column").value,el("value").value,el("mode").value);
  show((output.length-1)+" row groups · "+(output[0].length-1)+" column groups");
  renderTable(output);
  download("pivot.csv",encodeCsv(output));
});
