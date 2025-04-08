import { TAbstractFile, TFolder } from "obsidian";

// Needed to support monkey-patching of the folder sort() function

declare module "obsidian" {
  export type PathVirtualElement = PathVirtualFile | PathVirtualFolder;

  export interface PathVirtualFile {
    coverEl: HTMLElement;
    el: HTMLElement;
    file: TAbstractFile;
    info: {
      childLeft: number;
      childLeftPadding: number;
      childTop: number;
      computed: boolean;
      height: number;
      hidden: boolean;
      pinned?: boolean;
      next: boolean;
      queued: boolean;
      width: number;
    };
    innerEl: HTMLElement;
    parent: PathVirtualFile;
    rendered: boolean;
    selfEl: HTMLElement;
    tagEl: HTMLElement | null;
    view: FileExplorerView;
  }

  export interface PathVirtualFolder extends PathVirtualFile {
    childrenEl: HTMLElement;
    collapseEl: HTMLElement;
    collapsed: boolean;
    collapsible: boolean;
    pusherEl: HTMLElement;
    vChildren: {
      children: PathVirtualElement;
    };
    view: FileExplorerView;
  }

  interface FileExplorerFolder {}

  export interface FileExplorerView extends View {
    createFolderDom(folder: TFolder): FileExplorerFolder;
    requestSort(): void;

    fileItems: {
      [key: string]: PathVirtualElement;
    };
  }
}
