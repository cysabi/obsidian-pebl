import type {
  FileExplorerView,
  PathVirtualElement,
  Plugin,
  TFile,
} from "obsidian";
import { getDateFromFile } from "obsidian-daily-notes-interface";
import shimmer from "shimmer";

export function getFileExplorer(plugin: Plugin): FileExplorerView | undefined {
  const fileExplorerContainer = plugin.app.workspace
    .getLeavesOfType("file-explorer")
    ?.first();
  return fileExplorerContainer?.view as FileExplorerView;
}

export function isPatched(plugin: Plugin): boolean {
  const fileExplorer = getFileExplorer(plugin);
  if (!fileExplorer) return false;

  const proto = Object.getPrototypeOf(getFileExplorer(plugin));
  return proto.getSortedFolderItems.__wrapped;
}

export function patchFileExplorer(plugin: Plugin) {
  const fileExplorer = getFileExplorer(plugin);
  if (!fileExplorer) {
    throw Error("Could not find file explorer");
  }
  const workspace = plugin.app.workspace;
  const leaf = workspace.getLeaf(true);

  shimmer.wrap(
    Object.getPrototypeOf(fileExplorer),
    "getSortedFolderItems",
    function (old) {
      return function (...args: any[]) {
        // prepatch output
        let output: PathVirtualElement[] = old.call(this, ...args);
        if (output?.[0]?.file?.parent?.parent !== null) return output;

        const activeFile = this.app.workspace?.activeLeaf?.view?.file;
        const date = getDateFromFile(activeFile, "day");
        if (date) {
          const dailyNoteDates: Map<PathVirtualElement, moment.Moment> =
            new Map();
          const dailyNotes = output.filter((child) => {
            if ("collapsible" in child) {
              // TODO: show daily folders alongside daily files
            } else {
              const date = getDateFromFile(child.file as TFile, "day");
              if (date) {
                dailyNoteDates.set(child, date);
                return true;
              }
            }
          });

          return dailyNotes.sort((a, b) => {
            const dateA = dailyNoteDates.get(a);
            const dateB = dailyNoteDates.get(b);
            return dateA.isAfter(dateB) ? -1 : 1;
          });
        } else {
          // activeFile move to the top
          const activeI = output.findIndex(
            (c) =>
              !("collapsible" in c) &&
              (c.file as TFile).basename === activeFile?.basename
          );
          if (activeI !== -1) {
            const active = output[activeI];
            output.splice(activeI, 1);
            output.splice(0, 0, active);
          }

          // merge folders with files (for now i just want to move each folder below the file in the sort)
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

          // auto expand active folder?

          return output;
        }
      };
    }
  );

  plugin.register(() =>
    shimmer.unwrap(Object.getPrototypeOf(fileExplorer), "getSortedFolderItems")
  );
  leaf.detach();
}
