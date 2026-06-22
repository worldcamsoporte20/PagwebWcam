import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";

const webRoot = resolve(process.cwd());
const standaloneWebRoot = join(webRoot, ".next", "standalone", "apps", "web");
const serverFile = join(standaloneWebRoot, "server.js");

if (!existsSync(serverFile)) {
  throw new Error(`No se encontro ${serverFile}. Ejecuta primero: npm run build -w apps/web`);
}

function copyDir(from, to) {
  if (!existsSync(from)) {
    throw new Error(`No se encontro ${from}. El build de Next parece incompleto.`);
  }

  rmSync(to, { recursive: true, force: true });
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
}

copyDir(join(webRoot, "public"), join(standaloneWebRoot, "public"));
copyDir(join(webRoot, ".next", "static"), join(standaloneWebRoot, ".next", "static"));

console.log("Next standalone listo con public y .next/static.");
