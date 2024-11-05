import {computed, dom, Observable, observable} from 'grainjs';
import {Timeline} from 'vis-timeline';
import type * as Rx from 'rxjs';
import {buildColLabel, Command, withElementSpinner} from './lib';

export class HeaderMonitor {
  private headerMonitor!: ResizeObserver;
  private lastWidth = 0;
  private work = () => {};
  constructor() {
    this.work = debounced(this.invoke.bind(this), 5);
  }
  public start() {
    // Monitor left panel and adjust header left position.
    this.headerMonitor = new ResizeObserver(this.work);
    this.headerMonitor.observe(this.panel());
  }
  public invoke(...args: any[]) {
    const [panel, header] = [this.panel(), this.header()];
    const {left} = panel.querySelector('.vis-labelset')!.getBoundingClientRect();
    header.style.setProperty('--left-width', `${left}px`);
    const width = args[0][0].borderBoxSize[0].inlineSize;
    header.style.width = `${width}px`;
    if (this.lastWidth !== width) {
      this.lastWidth = width;
      recalculateHeader();
    }
  }

  private panel() {
    return document.querySelector('.vis-panel.vis-left')!;
  }

  private header() {
    return document.getElementById('groupHeader')!;
  }

  private pauseCalls = 0;

  public pause() {
    this.pauseCalls++;
    if (this.pauseCalls === 1) {
      this.headerMonitor.disconnect();
    }
  }

  public resume() {
    this.pauseCalls--;
    if (this.pauseCalls === 0) {
      this.headerMonitor.observe(this.panel());
    }
    if (this.pauseCalls < 0) {
      throw new Error('Unbalanced pause/resume calls');
    }
  }
}

export const headerMonitor = new HeaderMonitor();

export function rewriteHeader({mappings, timeline, cmdAddBlank}: {
  mappings: Observable<any>;
  timeline: Timeline;
  cmdAddBlank: Command;
}) {

  try {
    headerMonitor.pause();

    const headerTop = document.querySelector('#groupHeader .top')! as HTMLElement;
    const headerRight = document.querySelector('#groupHeader .bottom .right')! as HTMLElement;

    const columnsDiv = dom('div');
    columnsDiv.classList.add('group-header-columns');

    const columnElements = mappings.get().Columns.map((col: string) => {
      return dom('div',
        dom.text(buildColLabel(col)),
        dom.cls('group-part'),
        dom.style('padding', '5px')
      );
    });
    columnsDiv.style.setProperty('grid-template-columns', 'auto');

    const moreDiv = document.createElement('div');
    moreDiv.style.width = '20px';

    columnElements.push(moreDiv);
    const collapsed = observable(false);

    const iconName = computed(use => {
      return use(collapsed) ? 'chevron-bar-right' : 'chevron-bar-left';
    })

    const resizer = headerTop.querySelector('.resizer') as HTMLElement;
    const icon = headerTop.querySelector('sl-icon') as HTMLElement;
    const button = headerTop.querySelector('sl-button') as HTMLElement;
    const buttonLoading = observable(false);
    dom.update(resizer,
      dom.on('click', () => collapsed.set(!collapsed.get()))
    );
    dom.update(icon,
      // Icon to hide or show drawer.
      dom.prop('name', iconName)
    );
    dom.update(button,
      dom.prop('loading', buttonLoading),
      dom.on('click', async () => {
        try {
          buttonLoading.set(true);
          await cmdAddBlank.invoke(null);
        } finally {
          buttonLoading.set(false);
        }
      })
    );
    columnsDiv.append(...columnElements);

    collapsed.addListener(() => {
      timeline.redraw();
    });

    // Now we need to update its width, we can't break lines and anything like that.
    headerRight.innerHTML = '';
    headerRight.append(columnsDiv);
    // And set this width as minimum for the table rendered below.
    const visualization = document.getElementById('visualization')!;
    dom.update(visualization,
      dom.cls('collapsed', collapsed)
    );

    recalculateHeader();

  } finally {
    headerMonitor.resume();
  }
}

export function recalculateHeader() {

  try {
    headerMonitor.pause();

    const visualization = document.getElementById('visualization')!;
    const columnsDiv = document.querySelector('.group-header-columns')! as HTMLElement;
    const columnElements = Array.from(columnsDiv.children);

    // Now measure each individual line, and provide grid-template-columns variable with minimum
    // width to make up for a column and header width.
    // grid-template-columns: var(--grid-template-columns,  repeat(12, max-content));

    // First set the auto width.
    columnsDiv.style.setProperty('grid-template-columns',
      'auto '.repeat(columnElements.length - 1) + '20px 1fr');

    const widths = columnElements.map(part => part.getBoundingClientRect().width);
    const templateColumns = widths
      .map(w => `minmax(${w}px, max-content)`)
      .join(' ');

    visualization.style.setProperty('--grid-template-columns', templateColumns);
    anchorHeader();

    const firstLine = document.querySelector('.group-template');
    if (!firstLine) {
      console.error('No first line found');
      return;
    }

    const firstLineColumns = Array.from(firstLine.children)
      .map(elementWidth)
      .map(pixels)
      .join(' ');

    columnsDiv.style.setProperty('grid-template-columns', firstLineColumns);

    const firstPartWidth = Array.from(firstLine.children)[0].getBoundingClientRect().width;

    const width = Math.ceil(columnsDiv.getBoundingClientRect().width);
    // Set custom property --group-header-width to the width of the groupHeader
    visualization.style.setProperty('--group-header-width', `${width}px`);
    visualization.style.setProperty('--group-first-width', `${firstPartWidth}px`);


  } finally {
    headerMonitor.resume();
  }
}

export function anchorHeader() {
  const store = anchorHeader as any as {lastTop: number;};
  store.lastTop = store.lastTop ?? 0;
  const panelEl = document.querySelector('.vis-panel.vis-left')!;
  const headerEl = document.getElementById('groupHeader')!;
  const headerBottomEl = headerEl.querySelector('.bottom')! as HTMLElement;
  const headerTopEl = headerEl.querySelector('.top')! as HTMLElement;

  const contentEl = panelEl.querySelector('.vis-labelset')!;
  const top = Math.ceil(panelEl.getBoundingClientRect().top);
  if (top === store.lastTop) {
    return;
  }
  store.lastTop = top;
  headerTopEl.style.setProperty('height', `${top - 30}px`);

  // Also adjust the left property of the group-header, as it may have a scrool element.
  const left = Math.ceil(contentEl.getBoundingClientRect().left);
  headerEl.style.setProperty('left', `${left}px`);
}



const elementWidth = (el: Element) => el.getBoundingClientRect().width;
const pixels = (w: number) => `${w}px`;
function debounced(func: (...args: any[]) => void, wait: number = 100): () => void {
  let timeout: NodeJS.Timeout | null = null;
  return function(...args: any[]) {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}
