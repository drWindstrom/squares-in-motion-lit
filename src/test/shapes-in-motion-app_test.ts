import {ShapesInMotionApp} from '../shapes-in-motion-app.js';
import {fixture, html} from '@open-wc/testing';

const assert = chai.assert;

suite('shapes-in-motion-app', () => {
  test('is defined', () => {
    const el = document.createElement('shapes-in-motion-app');
    assert.instanceOf(el, ShapesInMotionApp);
  });

  test('renders with default values', async () => {
    const el = await fixture(html`<shapes-in-motion-app></shapes-in-motion-app>`);
    assert.shadowDom.equal(
      el,
      `
      <h1>Hello, World!</h1>
      <button part="button">Click Count: 0</button>
      <slot></slot>
    `
    );
  });

  test('renders with a set name', async () => {
    const el = await fixture(html`<shapes-in-motion-app name="Test"></shapes-in-motion-app>`);
    assert.shadowDom.equal(
      el,
      `
      <h1>Hello, Test!</h1>
      <button part="button">Click Count: 0</button>
      <slot></slot>
    `
    );
  });

  test('handles a click', async () => {
    const el = (await fixture(html`<shapes-in-motion-app></shapes-in-motion-app>`)) as ShapesInMotionApp;
    const button = el.shadowRoot!.querySelector('button')!;
    button.click();
    await el.updateComplete;
    assert.shadowDom.equal(
      el,
      `
      <h1>Hello, World!</h1>
      <button part="button">Click Count: 1</button>
      <slot></slot>
    `
    );
  });
});
