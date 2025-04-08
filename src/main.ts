import {
  Plugin,
  type FileExplorerView,
  type WorkspaceLeaf,
  type PathVirtualElement,
  type TFile,
} from "obsidian";
import shimmer from "shimmer";

export default class Pebl extends Plugin {
  async onload() {
    this.registerEvent(
      this.app.metadataCache.on("changed", (path, data, cache) => {
        this.getFileExplorer()?.requestSort();
      })
    );

    this.app.workspace.onLayoutReady(() => {
      this.patchFileExplorer();
      this.getFileExplorer()?.requestSort();
    });

    this.app.workspace.on("layout-change", () => {
      if (!this.isPatched()) {
        this.patchFileExplorer();
        this.getFileExplorer()?.requestSort();
      }
    });

    this.app.workspace.on("file-open", () => {
      this.getFileExplorer()?.requestSort();
    });
  }

  getFileExplorer(): FileExplorerView | undefined {
    const fileExplorerContainer = this.app.workspace
      .getLeavesOfType("file-explorer")
      ?.first();
    return fileExplorerContainer?.view as FileExplorerView;
  }

  isPatched(): boolean {
    const fileExplorer = this.getFileExplorer();
    if (!fileExplorer) return false;

    const proto = Object.getPrototypeOf(this.getFileExplorer());
    return proto.getSortedFolderItems.__wrapped;
  }

  patchFileExplorer() {
    const fileExplorer = this.getFileExplorer();
    if (!fileExplorer) {
      throw Error("Could not find file explorer");
    }
    const workspace = this.app.workspace;
    const leaf = workspace.getLeaf(true);

    shimmer.wrap(
      Object.getPrototypeOf(fileExplorer),
      "getSortedFolderItems",
      function (old) {
        return function (...args: any[]) {
          // sort by mtime
          let output: PathVirtualElement[] = old.call(this, ...args);
          if (output?.[0]?.file?.parent?.parent !== null) return output;
          console.log(output);

          // activeFile move to the top
          // activeFile auto expand
          const activeFile =
            this.app.workspace?.activeLeaf?.view?.file?.basename;
          console.log(activeFile);
          const activeI = output.findIndex(
            (c) =>
              !("collapsible" in c) && (c.file as TFile).basename === activeFile
          );
          if (activeI !== -1) {
            const active = output[activeI];
            output.splice(activeI, 1);
            output.splice(0, 0, active);
          }

          // merge folders with files
          // for now i just want to move each folder below the file in the sort
          const folders = output
            .map((child) => ("collapsible" in child ? child.file.name : false))
            .filter((child) => child !== false);

          folders.forEach((folderName) => {
            const folderI = output.findIndex(
              (c) => "collapsible" in c && c.file.name === folderName
            );
            const fileI = output.findIndex(
              (c) =>
                !("collapsible" in c) &&
                (c.file as TFile).basename === folderName
            );

            if (folderI !== -1 && fileI !== -1) {
              const folder = output[folderI];
              output.splice(folderI, 1);
              output.splice(fileI, 0, folder);
            } else {
              console.warn({ ["No file associated with folder"]: folderName });
            }
          });

          return output;
        };
      }
    );
    this.register(() =>
      shimmer.unwrap(
        Object.getPrototypeOf(fileExplorer),
        "getSortedFolderItems"
      )
    );

    leaf.detach();
  }

  onunload() {
    const fileExplorer = this.getFileExplorer();
    if (fileExplorer) {
      fileExplorer.requestSort();
    }
  }
}
