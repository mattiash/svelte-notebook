# svelte-notebook

Like jupyter but javascript.

## Getting started

```
npm install
npm run build
```

Look at files generated under output/

## Watching and regenerating

```
npm run dev
```

## Adding a new page

```
mkdir pages/my-new-page
```

Edit pages/my-new-page/index.md

## Writing code

Write normal javascript code with variable definitions.

```js
const a = 7 + 1;
```

The value of each non-trivial variable will be displayed next to the definition.
You can also refer to variables outside of code-blocks by writing expressions in
`{}` brackets. E.g. `{a}` or even `{Math.round(a/3)}`.

To insert a slider for changing the value of a variable, use the syntax

```
let b = 0:3:5
```

This means that b can be any value between 0 and 5 and it starts as 3.

The javascript code is run with Svelte, which means that you can use Svelte's reactive syntax to reevaluate expressions.

This allows you to recalculate expressions when the user changes a slider.

```
let c = 0:3:5
$: d = c * 2
```

## Hiding code

Code that you don't want to show in the web-browser can be marked as hidden with

> ```js hidden
>
> ```

This code will run, but the codeblock will not be rendered as html.

## Web-only code

If there is code that you only want to run in the browser (not when exporting markdown),
you can mark it as

> ```js webonly
>
> ```

## Inline Svg

svg-files can be inlined into the html with

```
svg:test.svg
```

The filename is relative to the markdown file. If the svg contains `{}` expressions,
they will be expanded just as in the markdown.

## Inline Png

png-files can be inlined into the html with

```
png:test.png
```

The filename is relative to the markdown file.

## Drawio integration

To include svg:s generated from a drawio source, perform the following steps:

1. Install [Drawio Desktop](https://github.com/jgraph/drawio-desktop)
2. Create an index.drawio file next to the index.md file
3. Each tab in the drawio file can be inserted in the markdown with

```
drawio:tab1
```

## Mermaid

Insert a [Mermaid](https://mermaid.js.org/) diagram with a mermaid code-section

    ```mermaid
    ---
    title: Test diagram
    ---
    graph LR
        A --- B
        B-->C[forbidden]
        B-->D(ok);
    ```

## Latex

Render Latex with

```
$$
V_{sphere} = \frac{4}{3}\pi r^3
$$
```

## Export mode

A document can be switched to export mode with a paragraph with the string '::export'.
This will make the output suitable for copy-pasting to other applications.

## Importing javascript

Common javascript code can be placed under `lib/` and imported using `$lib`:

```js
import * from '$lib/format.js'
```

## Exporting to plain Markdown

**TODO**

To export a plain Markdown document, run

```

node util/eval-markdown.js < src/routes/page2.md

```

This is useful for importing the finalized document into other systems that understand markdown.

## Exporting as html

```

npm run build

```

The generated html can be found in the `output/` directory as one file per page.
I.e. `pages/sample/index.md` will generate `output/sample.html`. Each html is self-contained,
including the png, svg and drawio tabs.

## Highlighting

Install a markdown plugin in vscode (or your editor of choice).
Mark all code-blocks with a js-prefix

> ```js
>
> ```

To highlight expressions outside of code-blocks,
install the Highlight plugin by Fabio Spampinato.

Configure it with (included in workspace already):

````

    "highlight.regexes": {
        "({)(.*?)(})": {
            "filterLanguageRegex": "markdown",
            "decorations": [
                {},
                {
                    "color": "#569CD6",
                },
                {}
            ],
        }
    },

```

```
````
