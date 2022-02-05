# svelte-notebook

Like jupyter but javascript.

## Getting started

```
npm install
npm run dev
```

Open the url displayed in your terminal.

## Adding a new page

1. Create a new md-file under `src/routes`
2. Add a link to the file in `src/routes/index.md`

## Writing code

Write normal javascript code with variable definitions.

```js
const a = 7+1
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

This code will run, but the codeblock will not be rendered as html.

## Web-only code

If there is code that you only want to run in the browser (not when exporting markdown),
you can mark it as

> ```js webonly

## Images

Images can be added under `static/` and referred to by their path relative to `static/`,
i.e. `static/img1.png` can be referred to as `img1.png`.

## Inline Svg

svg-files can be inlined into the html with

```
svg:test.svg
```

The filename is relative to the markdown file or it can be under $root/buildimage/$pagename/. If the svg contains `{}` expressions,
they will be expanded just as in the markdown.

## Exporting to plain Markdown

To export a plain Markdown document, run

```
node util/eval-markdown.js < src/routes/page2.md
```

This is useful for importing the finalized document into other systems that understand markdown.

## Exporting as html

```
npm run build
```

The generated html can be found in the `build/` directory.
Unfortunately, you need to serve it with an http server for your browser
to be able to render it correctly.

## Highlighting

Install a markdown plugin in vscode (or your editor of choice).
Mark all code-blocks with a js-prefix

> ```js

To highlight expressions outside of code-blocks,
install the Highlight plugin by Fabio Spampinato.

Configure it with (included in workspace already):

```
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
