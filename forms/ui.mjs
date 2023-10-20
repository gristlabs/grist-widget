const {dom, styled} = grainjs;

/**
 * This file contains all the HTML components without any logic.
 */

export const cssWrap = styled('div', `
  padding: 16px;
`);

export const cssEditWrap = styled('div', `
  padding: 16px;
  margin-top: 34px;
`);

export const cssButton = styled('button', `
  appearance: none;
  position: absolute;
  top: 4px;
  right: 4px;
  z-index: 100;
  background-color: #ffffff80;
  border: 1px solid #16b378;
  margin: 0;
  padding: 0;
  border-radius: 4px;
`);

// Same helpers for DOM.
export const row = styled('div', `
  display: flex;
`);

export const col = styled('div', `
  display: flex;
  flex-direction: column;
`);

export const gap = (size) => dom.style('gap', `${size}px`);
export const grow = () => dom.style('flex-grow', '1');
export const center = () => dom.style('align-items', 'center');
export const middle = () => dom.style('justify-content', 'center');
export const vs = (size) => dom('div', dom.style('height', `${size}px`));
export const hs = (size) => dom('div', dom.style('width', `${size}px`));
const p = (...args) => dom('p', ...args);

const cssSaveEditDialogWrapper = styled('div', `
  position: fixed;
  bottom: 0px;
  width: 100%;
  z-index: 100;
`);

const cssSaveEditDialog = styled('div', `
  margin: 0 auto;
  width: 600px;
  background: #16b378;
  color: white;
  border-bottom: none;
  padding: 16px;
  border-radius: 10px;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  box-shadow: 0 0 10px 0px #00000080;
`);

export function SaveEditDialog(options) {
  return cssSaveEditDialogWrapper(cssSaveEditDialog(
    dom('div',
      p('This is a sample from generated from your table.'),
      p('You can use it as it is. Just press "Save and share" button below.'),
      p('Or if you need some adjustments, press "Edit" button and you will be able tailor it to your needs.'),
    ),
    vs(16),
    row(
      gap(8),
      dom('button.btn btn-primary', 'Save and share', dom.on('click', options.save)),
      dom('button.btn btn-secondary', 'Edit', dom.on('click', options.edit)),
    ),
  ));
}

export const cssEditMode = styled('div', `
  position: fixed;
  top: 0px;
  right: 10px;
  padding: 4px 8px;
  background: #16b378;
  color: white;
  border-bottom-left-radius: 4px;
  border-bottom-right-radius: 4px;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  &:hover {
    background: /* darker */ #0f8f63;
  }
`);

export const SAMPLE_FORM = {
  components: [
    {
      type: 'textfield',
      key: 'firstName',
      label: 'First Name',
      placeholder: 'Enter your first name.',
      input: true,
      tooltip: 'Enter your <strong>First Name</strong>',
      description: 'Enter your <strong>First Name</strong>'
    },
    {
      type: 'textfield',
      key: 'lastName',
      label: 'Last Name',
      placeholder: 'Enter your last name',
      input: true,
      tooltip: 'Enter your <strong>Last Name</strong>',
      description: 'Enter your <strong>Last Name</strong>'
    },
    {
      type: "select",
      label: "Favorite Things",
      key: "favoriteThings",
      placeholder: "These are a few of your favorite things...",
      data: {
        values: [
          {
            value: "raindropsOnRoses",
            label: "Raindrops on roses"
          },
          {
            value: "whiskersOnKittens",
            label: "Whiskers on Kittens"
          },
          {
            value: "brightCopperKettles",
            label: "Bright Copper Kettles"
          },
          {
            value: "warmWoolenMittens",
            label: "Warm Woolen Mittens"
          }
        ]
      },
      dataSrc: "values",
      template: "<span>{{ item.label }}</span>",
      multiple: true,
      input: true
    },
    {
      type: 'button',
      action: 'submit',
      label: 'Submit',
      theme: 'primary'
    }
  ]
};
