import {
  Plugin,
  type FileExplorerView,
  type WorkspaceLeaf,
  type PathVirtualElement,
  type TFile,
} from "obsidian";
import shimmer from "shimmer";

export default class FileExplorerPlusPlugin extends Plugin {
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
      if (!this.getFileExplorer()?.fileExplorerPlusPatched) {
        this.patchFileExplorer();
        this.getFileExplorer()?.requestSort();
      }
    });
  }

  getFileExplorerContainer(): WorkspaceLeaf | undefined {
    return this.app.workspace.getLeavesOfType("file-explorer")?.first();
  }

  getFileExplorer(): FileExplorerView | undefined {
    const fileExplorerContainer = this.getFileExplorerContainer();
    return fileExplorerContainer?.view as FileExplorerView;
  }

  patchFileExplorer() {
    const fileExplorer = this.getFileExplorer();
    if (!fileExplorer) {
      throw Error("Could not find file explorer");
    }
    const workspace = this.app.workspace;
    const leaf = workspace.getLeaf(true);
    const activeFile = workspace.getActiveFile();

    shimmer.wrap(
      Object.getPrototypeOf(fileExplorer),
      "getSortedFolderItems",
      function (old) {
        return function (...args: any[]) {
          // sort by mtime
          let output: PathVirtualElement[] = old.call(this, ...args);
          if (output?.[0]?.file?.parent?.parent !== null) return output;
          console.log(output.length, output);

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
              console.log({ error: folderName });
            }
          });

          // activeFile move to the top
          // activeFile auto expand

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

    fileExplorer.fileExplorerPlusPatched = true;
  }

  onunload() {
    const fileExplorer = this.getFileExplorer();

    if (!fileExplorer) {
      return;
    }

    fileExplorer.requestSort();
    fileExplorer.fileExplorerPlusPatched = false;
  }
}
