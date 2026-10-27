#!/usr/bin/env bun
/**
 * Tandem fork build step (not for upstream).
 *
 * `bun pm pack` in packages/coding-agent runs `prepack`, whose bundle step loads
 * `@oh-my-pi/pi-natives`. A source checkout has no compiled addon, and this fork
 * carries no Rust changes, so fetch the published prebuilt addon for the exact
 * workspace version instead of building it. The npm integrity hash is checked.
 */
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

const repoRoot = path.resolve(import.meta.dir, "..");
const nativeDir = path.join(repoRoot, "packages/natives/native");
const { version } = await Bun.file(path.join(repoRoot, "packages/natives/package.json")).json();
const pkg = `@oh-my-pi/pi-natives-${process.platform}-${process.arch}`;

const metaRes = await fetch(`https://registry.npmjs.org/${pkg}/${version}`);
if (!metaRes.ok) throw new Error(`${pkg}@${version}: registry answered ${metaRes.status}`);
const { dist } = (await metaRes.json()) as { dist: { tarball: string; integrity: string } };

const tarRes = await fetch(dist.tarball);
if (!tarRes.ok) throw new Error(`${dist.tarball}: ${tarRes.status}`);
const tarball = new Uint8Array(await tarRes.arrayBuffer());
const [algo, expected] = dist.integrity.split("-", 2);
if (algo !== "sha512") throw new Error(`unsupported integrity algorithm ${algo}`);
const actual = new Bun.CryptoHasher("sha512").update(tarball).digest("base64");
if (actual !== expected) throw new Error(`${pkg}@${version}: integrity mismatch`);

const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "pi-natives-"));
try {
	const tgz = path.join(tmp, "pkg.tgz");
	await Bun.write(tgz, tarball);
	const tar = Bun.spawnSync(["tar", "-xzf", tgz, "-C", tmp], { stderr: "inherit" });
	if (tar.exitCode !== 0) throw new Error(`tar exited ${tar.exitCode}`);
	const nodes = (await fs.readdir(path.join(tmp, "package"))).filter(f => f.endsWith(".node"));
	if (nodes.length === 0) throw new Error(`${pkg}@${version} has no .node files`);
	for (const file of nodes) {
		await fs.copyFile(path.join(tmp, "package", file), path.join(nativeDir, file));
		console.log(`tandem: installed ${file} from ${pkg}@${version}`);
	}
} finally {
	await fs.rm(tmp, { recursive: true, force: true });
}
