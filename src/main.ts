import {
  Plugin,
  FileExplorerView,
  WorkspaceLeaf,
  PathVirtualElement,
} from "obsidian";
import shimmer from "shimmer";

export default class FileExplorerPlusPlugin extends Plugin {
  async onload() {
    console.log("load!");
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
      // console.log(
      //   Object.getPrototypeOf(this.getFileExplorer()).getSortedFolderItems
      //     ._wrapped
      // );
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

          let sortedChildren: PathVirtualElement[] = old.call(this, ...args);

          // merge folders with files
          // for now i just want to move each folder below the file in the sort
          sortedChildren.forEach((child, folderI) => {
            if (!("collapsible" in child)) return;

            let fileI = sortedChildren.findIndex((c) => {
              if (!("collapsible" in child)) return;
              return child.file.name === c.file.basename;
            });

            if (fileI > -1) {
              const element = sortedChildren[folderI];
              console.log(element.file.name);
              sortedChildren.splice(folderI, 1);
              sortedChildren.splice(fileI, 0, element);
            } else {
              console.log([folderI, fileI], child);
            }

            return sortedChildren;
          });

          // activeFile move to the top
          // activeFile auto expand

          console.log(sortedChildren);
          return sortedChildren;
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
