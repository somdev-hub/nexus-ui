const path = require("path");
const fs = require("fs");

const config = {
  plugins: {
    "postcss-import": {
      resolve(id, basedir) {
        const absolute = path.isAbsolute(id)
          ? id
          : path.join(basedir, id);

        if (fs.existsSync(absolute)) {
          return absolute;
        }

        const nodeModules = path.join(basedir, "node_modules", id);
        if (fs.existsSync(nodeModules)) {
          return nodeModules;
        }

        if (id === "shadcn/tailwind.css") {
          const resolved = path.join(
            basedir,
            "node_modules",
            "shadcn",
            "dist",
            "tailwind.css"
          );
          if (fs.existsSync(resolved)) {
            return resolved;
          }
        }

        return id;
      },
    },
    "@tailwindcss/postcss": {},
  },
};

export default config;
