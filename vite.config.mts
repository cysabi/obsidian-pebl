import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import tailwindcss from "@tailwindcss/vite";
import builtins from "builtin-modules";

export default defineConfig({
  plugins: [tailwindcss(), solid()],
  build: {
    target: "es2018",
    cssCodeSplit: true,
    lib: {
      entry: ["src/main.ts", "src/styles.css"],
      formats: ["cjs"],
    },
    emptyOutDir: false,
    outDir: `/mnt/c/Users/cysabi/Desktop/.obsidian/plugins/pebl`,
    sourcemap: "inline",
    rollupOptions: {
      external: [
        "obsidian",
        "electron",
        "@codemirror/autocomplete",
        "@codemirror/closebrackets",
        "@codemirror/collab",
        "@codemirror/commands",
        "@codemirror/comment",
        "@codemirror/fold",
        "@codemirror/gutter",
        "@codemirror/highlight",
        "@codemirror/history",
        "@codemirror/language",
        "@codemirror/lint",
        "@codemirror/matchbrackets",
        "@codemirror/panel",
        "@codemirror/rangeset",
        "@codemirror/rectangular-selection",
        "@codemirror/search",
        "@codemirror/state",
        "@codemirror/stream-parser",
        "@codemirror/text",
        "@codemirror/tooltip",
        "@codemirror/view",
        "@lezer/common",
        "@lezer/highlight",
        "@lezer/lr",
        ...builtins,
      ],
    },
  },
});
