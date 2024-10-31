/**
 * This file contains the code to build the cursor highlight on the timeline.
 */

import {from} from 'fromit';
import {Timeline} from 'vis-timeline';
import type * as Rx from 'rxjs';

export function buildCursor(timeline: Timeline, options: {
  eventAdd: Rx.Observable<number>,
}) {

  const cursorBox = document.createElement('div');
  cursorBox.append(document.createElement('sl-spinner'));
  cursorBox.addEventListener('dblclick', async function(e) {
    cursorBox.classList.add('cursor-loading');
  });
  options.eventAdd.subscribe(() => cursorBox.classList.remove('cursor-loading'));

  const foreground = document.querySelector('.vis-center .vis-foreground') as HTMLElement;
  cursorBox.className = 'cursor-selection';
  foreground.appendChild(cursorBox);
  foreground.addEventListener('mouseleave', function() {
    cursorBox.style.display = 'none';
  });

  

  foreground.addEventListener('mousemove', function(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (target === cursorBox) {
      return;
    }
    // If the target is inside the cursorBox also do nothing.
    if (cursorBox.contains(target)) {
      return;
    }

    // Get the x position in regards of the parent.
    const x = e.clientX - foreground.getBoundingClientRect().left;

    // Make sure target has vis-group class.
    if (!target.classList.contains('vis-group')) {
      cursorBox.style.display = 'none';
      return;
    }
    cursorBox.style.display = 'grid';

    // Now get the element at that position but in another div.
    const anotherDiv = document.querySelector(
      'div.vis-panel.vis-background.vis-vertical > div.vis-time-axis.vis-background'
    )!;

    const anotherDivPos = anotherDiv.getBoundingClientRect().left;

    if (!leftPoints.length) {
      const children = Array.from(anotherDiv.children);
      // Group by week number, element will have class like vis-week4

      // Get current scale from timeline.
      const weekFromElement = (el: Element) => {
        const classList = Array.from(el.classList)
          .filter(f => !['vis-even', 'vis-odd', 'vis-minor', 'vis-major'].includes(f))
        return classList.join(' ');
      };

      // Group by class attribute.
      const grouped = from(children)
        .groupBy(e => weekFromElement(e))
        .toArray();

      // Map to { left: the left of the first element in group, width: total width of the group }
      const points = grouped.map(group => {
        const left = group.first().getBoundingClientRect().left;
        const width = group.reduce(
          (acc, el) => acc + el.getBoundingClientRect().width,
          0
        );
        const adjustedWidth = left - anotherDivPos;
        return {left: adjustedWidth, width};
      });

      leftPoints = points;
    }

    // Find the one that is closest to the x position, so the first after.
    const index = leftPoints.findLastIndex(c => c.left < x);

    // Find its index.
    const closest = leftPoints[index];

    // Now get the element from the other div.


    // Now reposition selection.
    cursorBox.style.left = `${closest.left}px`;
    cursorBox.style.width = `${closest.width}px`;
    cursorBox.style.transform = '';
    try {
      if (cursorBox.parentElement !== target) {
        target.prepend(cursorBox);
      }
    } catch (ex) {}
  });




  // Helper to track cursor box on the timeline while scrolling.
  let leftPoints = [] as {left: number; width: number}[];
  timeline.on('rangechange', ({byUser, event}) => {
    leftPoints = [];
    if (!byUser) {
      return;
    }
    if (!event || !event.deltaX) {
      return;
    }
    const deltaX = event.deltaX;
    cursorBox.style.transform = `translateX(${deltaX}px)`;
  });
  timeline.on('rangechanged', () => {
    // Try to parse transform, and get the x value.
    const transform = cursorBox.style.transform;
    if (!transform) {
      return;
    }
    const match = transform.match(/translateX\(([^)]+)\)/);
    if (!match) {
      return;
    }
    const x = parseFloat(match[1]);

    // Update left property of the cursorBox, by adding the delta.
    const left = parseFloat(cursorBox.style.left);
    cursorBox.style.left = `${left + x}px`;
    cursorBox.style.transform = '';
  })

}