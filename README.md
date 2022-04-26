# Angular Multilanguage Script &middot; [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/valeriogiocondi/angular-multilanguage-script/blob/master/LICENSE)

This is a NodeJS script to set multilanguage pipe to an Angular project.


# Description
## How it works
It starts searching every .html file to find sentences to translate. 

The script includes a parser to scan every tag, looking for a sentence, going ahead for nested elements and ignoring comments and some special tags (like ```<mat-icon>```).
All sentences will be replaced by the pipe and mapped into a JSON-language-file to a key, calculated by the sentence.

At the end it checks if need to import the multilanguage pipe into related typescript component.

## How it starts
```
node ./index.js
```


# License

Angular Multilanguage Script is open source software [licensed as MIT](https://github.com/valeriogiocondi/reactitude/blob/master/LICENSE). 
