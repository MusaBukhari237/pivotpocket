export function parseCsv(input) {
  const text = input.replace(/^\uFEFF/, "");
  if (!text.trim()) throw new Error("Paste a CSV with a header row.");
  const rows = [];
  let row = [], cell = "", quoted = false, closed = false;
  for (let i = 0; i <= text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === undefined) throw new Error("Unclosed quoted field.");
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') { quoted = false; closed = true; }
      else cell += ch;
      continue;
    }
    if (ch === undefined || ch === "," || ch === "\r" || ch === "\n") {
      row.push(cell); cell = ""; closed = false;
      if (ch !== ",") {
        if (row.some(value => value !== "") || row.length > 1) rows.push(row);
        row = [];
        if (ch === "\r" && text[i + 1] === "\n") i++;
      }
    } else if (closed || (ch === '"' && cell)) {
      throw new Error("Unexpected characters around a quoted field.");
    } else if (ch === '"') quoted = true;
    else cell += ch;
  }
  const header = rows.shift()?.map(name => name.trim());
  if (!header?.length || header.some(name => !name) || new Set(header).size !== header.length) {
    throw new Error("CSV headers must be non-empty and unique.");
  }
  return {header, rows};
}
export function encodeCsv(rows) {
  return rows.map(row => row.map(value => {
    const text = String(value);
    const safe = /^(?:\s*[=+@-]|[\t\r\n])/.test(text) ? "'" + text : text;
    return '"' + safe.replaceAll('"', '""') + '"';
  }).join(",")).join("\r\n") + "\r\n";
}

export function pivot(input, row, column, value, mode) {
  const {header, rows} = parseCsv(input);
  const ri = header.indexOf(row), ci = header.indexOf(column), vi = header.indexOf(value);
  if (ri < 0 || ci < 0 || !["count","sum"].includes(mode) || (mode === "sum" && vi < 0)) throw new Error("Select columns from the header.");
  const table = new Map(), columns = new Set();
  for (const [index, entry] of rows.entries()) {
    if (entry.length !== header.length) throw new Error("Wrong column count in record " + (index+2) + ".");
    const rval = entry[ri], cval = entry[ci], number = mode === "sum" ? entry[vi].trim() : "1";
    if (!/^-?(?:\d+(?:\.\d+)?|\.\d+)$/.test(number) || !Number.isFinite(Number(number))) throw new Error("Non-numeric value in record " + (index+2) + ".");
    columns.add(cval);
    if (!table.has(rval)) table.set(rval,new Map());
    if (columns.size > 40 || table.size > 200) throw new Error("Limit grouping to 200 rows and 40 columns.");
    const cells = table.get(rval);
    const amount = (cells.get(cval) ?? 0) + Number(number);
    if (!Number.isFinite(amount)) throw new Error("Sum exceeds the supported numeric range.");
    cells.set(cval,amount);
  }
  return [[row, ...columns], ...[...table].map(([name,cells]) => [name,...[...columns].map(key => cells.get(key) ?? 0)])];
}
