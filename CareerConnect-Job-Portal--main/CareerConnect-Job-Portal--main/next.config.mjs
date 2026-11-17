import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pin the workspace root so Turbopack does not pick up a lockfile from a
  // parent directory (for example C:\Users\<name>\package-lock.json).
  turbopack: {
    root: path.resolve(import.meta.dirname ?? process.cwd()),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
