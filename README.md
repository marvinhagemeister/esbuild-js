# JS-Parser

This parser started out on a rainy day whilst reading through the source code of [esbuild](https://github.com/evanw/esbuild). Evan did an outstanding job in ensuring that the parser does a single pass. Only with the recent addition of scope-tracking there was a need to introduce a second one. Despite of that it's easily one if not the fastest parser for JS currently around. I was wondering how much of that can be attributed to chosing a different lanuguage vs better algorithms and being mindful of allocations.

On that day and the day after I ported most of the lexer to JS. But I lost interest in working on it, until a few months later the topic of parsers came up in relation to other projects. Out of curiosity I tried to build the parser on top of the existing lexer. It's very much translated from [esbuild](https://github.com/evanw/esbuild), with a different AST structure. The initial goal was to have it be complient with estree/acorn to make it easy to reuse existing plugins. The more I'm diving into to it, the more I'm questioning that noble goal though. Numeric literals and variables can benefit from much better structures and so I've began to slowly deviate from acorn/estree.

The current goal is to finish translating the missing bits of the parser for the JS-Grammar. I'm currently skipping everything related to TS and any scope-tracking.

Note, that this repo is an experiment for now.

## Name

The current name is crap, need a better one.
