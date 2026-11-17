import fs from "fs";
import path from "path";

const reps = [
  ["text-blue-400", "text-[#006A3B]"],
  ["bg-blue-500/10", "bg-[#E5F0EB]"],
  ["bg-blue-500/5", "bg-[#F4F7F6]"],
  ["border-blue-500/30", "border-[#66A689]/30"],
  ["border-blue-500/20", "border-[#66A689]/20"],
  ["border-blue-500/50", "border-[#66A689]/50"],
  ["border-blue-500 ", "border-[#66A689] "],
  ["bg-blue-600", "bg-[#006A3B]"],
  ["accent-blue-600", "accent-[#006A3B]"],
  ["group-hover:text-blue-400", "group-hover:text-[#006A3B]"],
  ["from-blue-600/5", "from-[#006A3B]/5"],
  ["shadow-blue-600/20", "shadow-[#006A3B]/20"],
  ["hover:shadow-blue-600/20", "hover:shadow-[#006A3B]/20"],
  ["bg-blue-600/5", "bg-[#006A3B]/5"],
];

function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const s = fs.statSync(p);
    if (s.isDirectory()) {
      if (f === "node_modules" || f === ".next") continue;
      walk(p);
    } else if (/\.(tsx|css)$/.test(f)) {
      let c = fs.readFileSync(p, "utf8");
      let orig = c;
      for (const [a, b] of reps) c = c.split(a).join(b);
      if (c !== orig) fs.writeFileSync(p, c);
    }
  }
}

walk("app");
walk("components");
console.log("Brand color migration complete");
