---
layout: page.11ty.cjs
title: <shapes-in-motion-app> ⌲ Home
---

# &lt;shapes-in-motion-app>

`<shapes-in-motion-app>` is an awesome element. It's a great introduction to building web components with LitElement, with nice documentation site as well.

## As easy as HTML

<section class="columns">
  <div>

`<shapes-in-motion-app>` is just an HTML element. You can it anywhere you can use HTML!

```html
<shapes-in-motion-app></shapes-in-motion-app>
```

  </div>
  <div>

<shapes-in-motion-app></shapes-in-motion-app>

  </div>
</section>

## Configure with attributes

<section class="columns">
  <div>

`<shapes-in-motion-app>` can be configured with attributed in plain HTML.

```html
<shapes-in-motion-app name="HTML"></shapes-in-motion-app>
```

  </div>
  <div>

<shapes-in-motion-app name="HTML"></shapes-in-motion-app>

  </div>
</section>

## Declarative rendering

<section class="columns">
  <div>

`<shapes-in-motion-app>` can be used with declarative rendering libraries like Angular, React, Vue, and lit-html

```js
import {html, render} from 'lit-html';

const name="lit-html";

render(html`
  <h2>This is a &lt;shapes-in-motion-app&gt;</h2>
  <shapes-in-motion-app .name=${name}></shapes-in-motion-app>
`, document.body);
```

  </div>
  <div>

<h2>This is a &lt;shapes-in-motion-app&gt;</h2>
<shapes-in-motion-app name="lit-html"></shapes-in-motion-app>

  </div>
</section>
