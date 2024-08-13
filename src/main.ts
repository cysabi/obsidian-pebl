import { MarkdownPostProcessor, Plugin } from "obsidian";
import { DataArray, getAPI, Link, Literal } from "obsidian-dataview";
import "./styles.css";
import {
  ViewUpdate,
  PluginValue,
  EditorView,
  ViewPlugin,
} from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import {
  Extension,
  RangeSetBuilder,
  StateField,
  Transaction,
} from "@codemirror/state";
import { Decoration, DecorationSet, WidgetType } from "@codemirror/view";

type Pebl = {
  file: {
    link: Link;
    outlinks: DataArray<Link>;
    name: string;
  };
};

export class PeblWidget extends WidgetType {
  toDOM(view: EditorView): HTMLElement {
    const div = document.createElement("input");
    div.style.display = "inline-block";
    div.type = "checkbox";
    return div;
  }
}

export const peblStateView = StateField.define<DecorationSet>({
  create(state): DecorationSet {
    return Decoration.none;
  },
  update(oldState: DecorationSet, transaction: Transaction): DecorationSet {
    const builder = new RangeSetBuilder<Decoration>();

    syntaxTree(transaction.state).iterate({
      enter(node) {
        if (node.type.name.startsWith("hmd-internal-link")) {
          builder.add(
            node.from,
            node.to,
            Decoration.mark({
              inclusive: true,
              class: "pebl",
            })
          );
        }
      },
    });
    return builder.finish();
  },
  provide(field: StateField<DecorationSet>): Extension {
    return EditorView.decorations.from(field);
  },
});

export default class PeblPlugin extends Plugin {
  async onload() {
    this.registerEditorExtension(peblStateView);
    this.registerMarkdownPostProcessor((el, ctx) => {
      const tree: (Pebl & { depth: number })[] = [];

      const dv = getAPI(this.app);
      const getSubs = (
        pages: DataArray<Record<string, Literal>>,
        depth: number = 0
      ) => {
        const pebls = pages
          .where((page) => page["pebl.task"] != undefined)
          .file.link.map((link: Link) => dv.page(link)) as DataArray<Pebl>;

        pebls.forEach((pebl) => {
          tree.push({ ...pebl, depth });
          getSubs(
            pebl.file.outlinks.map((out) => dv.page(out)),
            depth + 1
          );
        });
      };
      getSubs(dv.pages("outgoing([[]])", ctx.sourcePath));

      console.log(tree);
      console.log(el.findAll(".internal-link"));

      el.findAll(".internal-link").map((link) => {
        const data = tree.find((t) => t.file.name === link.dataset.href);
        if (data) {
          const wrap = document.createElement("span");
          wrap.className = "pebl";
          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.checked = data.pebltask;
          checkbox.onchange = (ev) => {
            ev.preventDefault();
          };

          link.parentNode.insertBefore(wrap, link);

          wrap.appendChild(checkbox);
          wrap.appendChild(link);
        }
      });
    });
  }
}
