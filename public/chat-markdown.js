const BLOCK_TAGS = new Set(["p", "h1", "h2", "h3", "h4", "ul", "ol", "blockquote", "pre", "table", "hr"]);

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function safeHref(value) {
  const href = String(value || "").trim();
  return /^(https?:\/\/|mailto:)/i.test(href) ? href : "#";
}

export function formatInlineMarkdown(value = "") {
  let text = escapeHtml(value);
  const tokens = [];
  const token = (html) => {
    const key = `\u0000${tokens.length}\u0000`;
    tokens.push(html);
    return key;
  };

  // Protect code and links before applying emphasis, then restore them at the end.
  text = text.replace(/`([^`\n]+)`/g, (_, code) => token(`<code>${code}</code>`));
  text = text.replace(/!?\[([^\]]+)\]\(([^\s)]+)(?:\s+&quot;[^&]*&quot;)?\)/g, (match, label, href) => {
    if (match.startsWith("!")) return label;
    return token(`<a href="${escapeHtml(safeHref(href))}" target="_blank" rel="noopener noreferrer">${label}</a>`);
  });
  text = text.replace(/(https?:\/\/[^\s<]+)/g, (href) => {
    const trailing = href.match(/[.,!?;:]+$/)?.[0] || "";
    return token(`<a href="${escapeHtml(safeHref(href.slice(0, -trailing.length)))}" target="_blank" rel="noopener noreferrer">${href.slice(0, -trailing.length)}</a>`) + trailing;
  });
  text = text
    .replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_\n]+)__/g, "<strong>$1</strong>")
    .replace(/~~([^~\n]+)~~/g, "<del>$1</del>")
    .replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s).,!?:;]|$)/g, "$1<em>$2</em>")
    .replace(/(^|[\s(])_([^_\n]+)_(?=[\s).,!?:;]|$)/g, "$1<em>$2</em>");

  return text.replace(/\u0000(\d+)\u0000/g, (_, index) => tokens[Number(index)]);
}

function isTableSeparator(line) {
  return /^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
}

function splitTableRow(line) {
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return trimmed.split("|").map((cell) => cell.trim());
}

function renderTable(header, rows) {
  const head = header.map((cell) => `<th scope="col">${formatInlineMarkdown(cell)}</th>`).join("");
  const body = rows.map((row) => {
    const cells = header.map((_, index) => row[index] ?? "");
    return `<tr>${cells.map((cell) => `<td>${formatInlineMarkdown(cell)}</td>`).join("")}</tr>`;
  }).join("");
  return `<div class="chat-table-wrap"><table><thead><tr>${head}</tr></thead>${body ? `<tbody>${body}</tbody>` : ""}</table></div>`;
}

function renderList(items, ordered) {
  const tag = ordered ? "ol" : "ul";
  return `<${tag}>${items.map((item) => `<li>${formatInlineMarkdown(item)}</li>`).join("")}</${tag}>`;
}

export function formatMessageContent(input = "") {
  const lines = String(input).replace(/\r\n?/g, "\n").split("\n");
  const output = [];
  let paragraph = [];
  let list = [];
  let listOrdered = false;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    output.push(`<p>${paragraph.map(formatInlineMarkdown).join("<br>")}</p>`);
    paragraph = [];
  };
  const flushList = () => {
    if (!list.length) return;
    output.push(renderList(list, listOrdered));
    list = [];
  };
  const flush = () => { flushParagraph(); flushList(); };

  for (let index = 0; index < lines.length; index += 1) {
    const raw = lines[index];
    const line = raw.trim();
    if (!line) { flush(); continue; }

    if (/^```/.test(line)) {
      flush();
      const code = [];
      index += 1;
      while (index < lines.length && !/^```/.test(lines[index].trim())) code.push(lines[index]);
      output.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
      continue;
    }

    if (index + 1 < lines.length && line.includes("|") && isTableSeparator(lines[index + 1])) {
      flush();
      const header = splitTableRow(line);
      const rows = [];
      index += 2;
      while (index < lines.length && lines[index].trim() && lines[index].includes("|")) {
        rows.push(splitTableRow(lines[index]));
        index += 1;
      }
      index -= 1;
      output.push(renderTable(header, rows));
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.+)$/) || line.match(/^([1-9]️⃣)\s+(.+)$/u);
    if (heading) {
      flush();
      const isHashHeading = heading[1].startsWith("#");
      const level = isHashHeading ? Math.min(heading[1].length, 4) : 2;
      const content = isHashHeading ? heading[2] : `${heading[1]} ${heading[2]}`;
      output.push(`<h${level}>${formatInlineMarkdown(content)}</h${level}>`);
      continue;
    }
    if (/^([-*_])(?:\s*\1){2,}$/.test(line)) { flush(); output.push("<hr>"); continue; }

    const quote = line.match(/^>\s?(.*)$/);
    if (quote) { flush(); output.push(`<blockquote>${formatInlineMarkdown(quote[1])}</blockquote>`); continue; }

    const ordered = line.match(/^\d+[.)]\s+(.+)$/);
    const unordered = line.match(/^[-*+]\s+(.+)$/);
    if (ordered || unordered) {
      flushParagraph();
      const isOrdered = Boolean(ordered);
      if (list.length && listOrdered !== isOrdered) flushList();
      listOrdered = isOrdered;
      list.push((ordered || unordered)[1]);
      continue;
    }

    // Indented continuation lines remain part of the current list item.
    if (/^\s{2,}/.test(raw) && list.length) {
      list[list.length - 1] += ` ${line}`;
      continue;
    }
    flushList();
    paragraph.push(line);
  }
  flush();
  return output.join("");
}

export { escapeHtml };
