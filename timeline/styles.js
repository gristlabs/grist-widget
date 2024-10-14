class CustomButton extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    const button = document.createElement('button');
    button.innerHTML = this.innerHTML;

    // Apply styles
    const style = document.createElement('style');
    style.textContent = `
        button {
          background: #16b378;
          border: none;
          border-radius: 4px;
          font-size: inherit;
          padding: 4px 8px;
          color: white;
          cursor: pointer;
          transition: background 0.3s;
          width: 100%;
        }
        
        button:hover {
          background: #13a067;
        }
        
        button:active {
          background: #0f8a56;
        }
    `;

    this.shadowRoot.append(style, button);
  }
}

customElements.define('x-button', CustomButton);
