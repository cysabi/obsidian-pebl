import { Plugin, ItemView, WorkspaceLeaf, IconName } from "obsidian";
import { DataArray, Link } from "obsidian-dataview";
import "./styles.css";
type Pebl = {
  file: {
    link: Link;
    outlinks: DataArray<Link>;
    name: string;
  };
};

export class PeblView extends ItemView {
  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getIcon() {
    return "shapes";
  }

  getViewType() {
    return "pebl";
  }

  getDisplayText() {
    return "Pebl";
  }

  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();
    container.createEl("h4", { text: "Example view" });
  }

  async onClose() {}
}

export default class PeblPlugin extends Plugin {
  async onload() {
    console.log(
      this.app.workspace.getLeavesOfType("file-explorer")?.first()?.view
    );
  }

  async onunload() {}

  async activateView() {
    const { workspace } = this.app;

    let leaf: WorkspaceLeaf | null = null;
    const leaves = workspace.getLeavesOfType("pebl");

    if (leaves.length > 0) {
      // A leaf with our view already exists, use that
      leaf = leaves[0];
    } else {
      // Our view could not be found in the workspace, create a new leaf
      // in the right sidebar for it
      leaf = workspace.getRightLeaf(false);
      await leaf.setViewState({ type: "pebl", active: true });
    }

    // "Reveal" the leaf in case it is in a collapsed sidebar
    workspace.revealLeaf(leaf);
  }
}

// this.registerEditorExtension(peblStateView);
// this.registerMarkdownPostProcessor((el, ctx) => {
//   const tree: (Pebl & { depth: number })[] = [];

//   const dv = getAPI(this.app);
//   const getSubs = (
//     pages: DataArray<Record<string, Literal>>,
//     depth: number = 0
//   ) => {
//     const pebls = pages
//       .where((page) => page["pebl.task"] != undefined)
//       .file.link.map((link: Link) => dv.page(link)) as DataArray<Pebl>;

//     pebls.forEach((pebl) => {
//       tree.push({ ...pebl, depth });
//       getSubs(
//         pebl.file.outlinks.map((out) => dv.page(out)),
//         depth + 1
//       );
//     });
//   };
//   getSubs(dv.pages("outgoing([[]])", ctx.sourcePath));

//   console.log(tree);
//   console.log(el.findAll(".internal-link"));

//   el.findAll(".internal-link").map((link) => {
//     const data = tree.find((t) => t.file.name === link.dataset.href);
//     if (data) {
//       const wrap = document.createElement("span");
//       wrap.className = "pebl";
//       const checkbox = document.createElement("input");
//       checkbox.type = "checkbox";
//       checkbox.checked = data.pebltask;
//       checkbox.onchange = (ev) => {
//         ev.preventDefault();
//       };

//       link.parentNode.insertBefore(wrap, link);

//       wrap.appendChild(checkbox);
//       wrap.appendChild(link);
//     }
//   });
// });
