import { Plugin } from "obsidian";
import * as files from "./files";

export default class Pebl extends Plugin {
  async onload() {
    this.registerEvent(
      this.app.metadataCache.on("changed", () => {
        files.getFileExplorer(this)?.requestSort();
      })
    );

    this.app.workspace.onLayoutReady(() => {
      files.patchFileExplorer(this);
      files.getFileExplorer(this)?.requestSort();
    });

    this.app.workspace.on("layout-change", () => {
      if (!files.isPatched(this)) {
        files.patchFileExplorer(this);
        files.getFileExplorer(this)?.requestSort();
      }
    });

    this.app.workspace.on("file-open", () => {
      files.getFileExplorer(this)?.requestSort();
    });
  }
}
