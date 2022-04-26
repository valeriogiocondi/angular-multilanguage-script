const fs = require('fs');

const app = (moduleName) => {

  const getModuleNamePath = (module) => {

    if (module.indexOf('contract-closing') !== -1) return 'contract-closing';
    
    if (module.indexOf('appointments') !== -1) return 'administration';

    return module;
  }

  const LANGUAGE = 'IT';
  const MODULE_NAME = moduleName;
  const MODULE_NAME_PATH = getModuleNamePath(MODULE_NAME);
  const APP_PATH = '/your-project/src/app/';
  const MODULE_PATH = APP_PATH + MODULE_NAME +'/';
  const LANGUAGE_FILE = APP_PATH + 'shared/pipes/json/' + MODULE_NAME_PATH + '/' + '.' + LANGUAGE.toLowerCase() + '.json';
  const ILLEGAL_CHARS = ['\r', '\n', '\t'];
  const ALPHABET = [
    ...Array.from({length: 26}, ((x, i) => String.fromCharCode(i+65))),
    ...Array.from({length: 26}, ((x, i) => String.fromCharCode(i+97)))
  ];
  const SPECIAL_CHARS = {
    à: 'a', à: 'a', À: 'A',
    è: 'e', È: 'E', È: 'E',
    é: 'e', É: 'E', É: 'E',
    ì: 'i', Ì: 'I',
    ò: 'o', Ò: 'O',
    ù: 'u', Ù: 'U',
  };
  const SENTENCE_TYPE = {
    sentence: 'sentence',
    placeholder: 'placeholder',
    placeholderInput: 'placeholderInput',
  };
  const MSGS = [
    'Starting module: ' + MODULE_NAME.toUpperCase() + '\n\n',
    'Loading ...\n\n',
    'FINISH: Module ' + MODULE_NAME.toUpperCase() + ' has been translated!\n\n\n',
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++\n\n',
  ];
  
  const readDir = (root, arr) => {
  
    const files = fs.readdirSync(root);
  
    arr = arr || [];
  
    files.forEach(file => {
  
      const fileType = '.html';
      const fileName = root + file;
      
      if (fs.statSync(fileName).isDirectory())
        readDir(fileName + '/', arr);
      else if (file.endsWith(fileType))
        arr.push(fileName);
    });
  
    return arr;
  };
  
  const readOnFile = (file) => fs.readFileSync(file, 'utf8');
  
  const writeOnFile = (file, content) => fs.writeFileSync(file, content, { flag: 'w' });
  
  const replaceAll = (str, val, rep) => {
  
    let res = '';
    
    while (str.indexOf(val) !== -1) {
  
      str = str.replace(val, rep);
  
      // avoid infinite loop - in case $val is contained in $rep
      indexOfReplaced = str.indexOf(rep) + rep.length;
      res += str.substring(0, indexOfReplaced);
      str =  str.substring(indexOfReplaced, str.length);
    }
  
    res += str;
  
    return res;
  };

  const escapeDoubleQuote = (str) => {

    // escape to special symbols
    if (str.indexOf('"') !== -1)
      str = replaceAll(str, '"', '\\"');
    
      return str;
  };
  
  const exec = (file) => fileParser(file, readOnFile(file));
    
  const fileParser = (file, data) => {
    
    const minifyHTML = (data) => {
  
      let str = '';
  
      for (let i=0; i < data.length; i++) {
        
        if (ILLEGAL_CHARS.includes(data[i])) continue;
        str += data[i];
      }
  
      return str;
    };
  
    const getTextToTranslate = (data) => {
      
      const getSentences = (data) => {
  
        const skipTagBlackList = (data, i) => {

          // avoid <!-- COMMENTS -->
          if (data[i] === '<' && data[i+1] === '!' && data[i+2] === '-' && data[i+3] === '-') {
            
            for (i += 4; i < data.length; i++) {
              
              if (data[i] === '-' && data[i+1] === '-' && data[i+2] === '>') {
                i += 3;
                break;
              }
            }
            return i;
          }

          // avoid <mat-icon></mat-icon>
          const blackList = ['mat-icon'];
          for (let tag of blackList) {

            if (data[i] === '<' && data.substr(i, `<${tag}`.length) === `<${tag}`) {
  
              // find END of <mat-icon>
              for (; i < data.length; i++) {
  
                if (data[i] === '<' && data.substr(i, `</${tag}>`.length) === `</${tag}>`) {
                  i += `</${tag}>`.length;
                  break;
                }
              }
              return i;
            }
          }

          return i;
        }

        const isGood = (str) => {

          // special case
          if (str === '.') return false;

          // is pipe
          if (str.indexOf('translateSelect') !== -1) return false;

          // is email
          if ( (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(str)) ) return false;

          // is number
          if (!isNaN(str)) return false;
          
          // just symbols
          for (const c of str)   
            if ( !str.split('').map(x => ALPHABET.includes(x)).reduce((x,y) => x || y) ) 
              return false;

          const EXCLUDE_CHARS = ['<', '>', '[', ']', '{', '}', '<!--', '-->'];
            
          for (let i=0; i < EXCLUDE_CHARS.length; i++) 
            if (str.indexOf(EXCLUDE_CHARS[i]) != -1) return false;
    
          return true;
        };
        
        let arr = [], x = 0;
        const tag = ['<', '>'];
          
        for (let i=0; i < data.length; i++) {

          // avoid <!-- COMMENTS --> and other tags
          i = skipTagBlackList(data, i);
          
          // get placeholder
          let typeSentence = '';
          if (data[i] === `p`) {

            if (data.substring(i, i+13) === `placeholder="`) {

              typeSentence = SENTENCE_TYPE.placeholder;
              i += 13;

            } else if (data.substring(i-1, i+15) === `[placeholder]="'`) {

              typeSentence = SENTENCE_TYPE.placeholderInput;
              i += 15;
            } else {
              
              // exit from get placeholder
              continue;
            }

            // find END of placeholder
            const start = i;
            for (; i < data.length; i++) {

              if (data[i] === `'` && data[i+1] === `"` && SENTENCE_TYPE.placeholderInput)
                break;

              if (data[i] === `"` && SENTENCE_TYPE.placeholder) 
                break;
            }

            const word = data.substring(start, i).trim();
            
            // TODO
            // put into isGood function

            // filter i18n-placeholder
            if (word.indexOf('@') === -1) {
              
              if (word && isGood(word)) {

                // index: related to HTML file
                // pos:   order by other sentences
                arr.push({ sentence: word, index: start+1, pos: x, type: SENTENCE_TYPE[typeSentence] });
                x++;
              }
            }

            continue;
          }

          // <REGULAR-TAG> CASE
          
          if (data[i] !== tag[1]) continue;

          // avoid <tag /><tag> case 
          if (data[i] === tag[1] && data[i+1] === tag[0]) continue;

          // open tag found - searching sentence inside
          // check other tag-end </tag> or nested-tag-open <tag>
          for (const start=i; i < data.length; i++) {
            
            if (data[i] !== tag[0]) continue;
            
            // avoid <!-- COMMENTS --> and other tags
            // could be as nested tag
            i = skipTagBlackList(data, i);

            const word = data.substring(start+1, i).trim();

            if (word && isGood(word)) {

              // index: related to HTML file
              // pos:   order by other sentences
              arr.push({ sentence: word, index: start+1, pos: x, type: SENTENCE_TYPE.sentence });
              x++;
            }

            // exit from nested FOR to find another sentence
            break;
          }
        }  

        return arr;
      };
      
      const cleanUp = (arr) => {
  
        // delete empty strings
        return arr.map((x) => {
        
          ILLEGAL_CHARS.forEach(c => x.sentence = replaceAll(x.sentence, c, ''));
          return {...x, sentence: x.sentence.trim()};
  
        }).filter(x => x);
      };
  
      let arr = getSentences(data);
      arr = cleanUp(arr);
      
      return arr;
    };
    
    const minifiedData = minifyHTML(data);
    const arr = getTextToTranslate(minifiedData);
    
    if (arr.length > 0) translate(file, data, arr);
    
    return data;
  };
  
  const getRandomKey = () => {

    const chars = [
      ...Array.from({length: 10}, ((x, i) => String.fromCharCode(i+48))),
      ...ALPHABET
    ];
    const arrLen = chars.length;
    
    const N = 5;
    let str = '';
    
    for (let i=0; i<N; i++) {
      str += chars[ Math.floor(Math.random()*arrLen) ] + '';
    }  

    return '__' + str.toUpperCase();      
  };

    
  const translate = (filePath, contentHTML, sentenceList) => {
  
    const getKeySentencePipe = (arr) => {
  
      // [
      //   {
      //     key:                 String,
      //     sentence:            String,
      //     index:               number,
      //     pos:                 number,
      //     type:                value of SENTENCE_TYPE,
      //   }
      // ]
      let res = [];
      const data = JSON.parse(readOnFile(LANGUAGE_FILE, 'utf8'));

      const getKey = (str) => {

        const cutMultipleUnderscore = (str) => {

          for (i=0; i<str.length; i++) {

            if (str[i] === '_') {
              
              let j=i+1;
              for (; j<str.length; j++) {
              
                if (str[j] != '_') break;
              }
              
              if (j != i+1)
                return str.substr(0, i) + str.substr(j-1, str.length);
            
            }
          }

          return str;
        }
        
        const KEY_MAX_LENGTH = 30;
        const illegalChars = [ 
          '&egrave;', 
          '€', 
          '•', 
          '°', 
          '’', 
          '\'',
          ...Array.from({length: 32}, ((x, i) => String.fromCharCode(i+33)))
        ];

        // key doesn't allow special letters
        Object.keys(SPECIAL_CHARS).forEach((key) => {
          
          str = str.replace(key, SPECIAL_CHARS[key]);
        });

        for (let x of illegalChars) 
          str = replaceAll(str, x, ' ');
          
        str = str.trim();
        str = replaceAll(str, '  ', '_');
        str = replaceAll(str, ' ', '_');
        str = cutMultipleUnderscore(str);
        str = str.substring(0, KEY_MAX_LENGTH);
        str = str.toUpperCase();
        
        return str;
      };
        
      /*
       *  LANGUAGE_FILE issues
       *  no sentences duplicates allowed - same sentences will have the same key
       *
       *  build map sentence-key
       */
      const arrDistincts = Array.from( new Set( arr ) );
      let map = {};

      for (let val of arrDistincts) {
        
        val = val.sentence;

        // generate key
        key = getKey(val);
        
        // it is allow to use existed keys
        // check if LANGUAGE_FILE keys has the same content
        if (data[key]) {

          // different content
          if (val !== data[key]) {

            let found = false;

            // check if exists a duplicate (or another match key)
            for (const [dupKey, dupVal] of Object.entries(data)) {

              if (val === dupVal) {

                found = true;
                key = dupKey;
                break;
              }
            }
            
            // no match key found -> create a new duplicate
            if (!found)
              key += getRandomKey();
          }
        }

        // the key is the sentence - help to get info
        map[val] = key;
      }

      const getPipe = (type, key) => {

        if (type === SENTENCE_TYPE.placeholderInput) 
          return `'${key}' | translateSelect`;
        
        return `{{ '${key}' | translateSelect: translateContext.SHARED }}`;
      }
      
      // put key and pipe in sentenceList
      for (let val of arr) {
        res.push({ 
          ...val,  
          key: map[val.sentence], 
          pipe: getPipe(val.type, map[val.sentence]) 
        });
      }
      
      // calculate every exact index by pipe length
      res = ((arr) => {

        // ordered array by index (position in file)
        let ordered = arr.sort((a,b) => a.index - b.index);

        // get index by previous pipe list length
        let pipeDelta = 0;
        for (let i=1; i<ordered.length; i++) {
          
          pipeDelta += ordered[i-1].pipe.length - ordered[i-1].sentence.length;
          ordered[i].index = ordered[i].index + pipeDelta

        }

        // return arr order by origin criteria
        return ordered.sort((a,b) => (b.sentence.length - a.sentence.length));

      })(res);

      return res;
    };
  
    const writeLanguageFile = (obj) => {
    
      const data = JSON.parse(readOnFile(LANGUAGE_FILE, 'utf8'));
      const text = JSON.stringify({ ...data, ...obj}, null, 2)
      writeOnFile(LANGUAGE_FILE, text);
    };
  
    const writeImportPipeTS = (file) => {
  
      // import pipe in .ts
      
      try {

        // write translation in language file
        const data = readOnFile(file);

        let res = start = '';
        const translateToCheck = [
          '@shared/pipes/translate.pipe',
          'TranslateContext = TranslateContext',
        ];
        const translateImport = [
          'import { TranslateContext } from \'@shared/pipes/translate.pipe\';',
          '\ttranslateContext: TranslateContext = TranslateContext.' + replaceAll(MODULE_NAME_PATH, '-', '_').toUpperCase() + ';',
        ];
        
        // check if pipe is already imported
        if (data.indexOf(translateToCheck[0]) === -1) {
    
          // get indexOf last row of import
          start = data.lastIndexOf('import ');
          
          // handle import not-inline
          start += data.substring(start, data.length).indexOf('from');

          for (let i=start; i<data.length; i++) {
            
            if (data[i] === '\n') {
              
              // append import of pipe
              res = data.slice(0, i+1) + translateImport[0] + '\n' + data.slice(i+1, data.length);
              break;
            }
          }
        }
        
        // check if variable translate related to MODULE
        if (data.indexOf(translateToCheck[1]) === -1) {
    
          // append variable translate before constructor
          start = res.lastIndexOf('constructor');
          for (let i=start,hasNewLine=0; i>=0; i--) {
            
            // a 1 newline is enough
            if (res[i] === '\n')
              hasNewLine++;
              
            // searching end of last import, or getter/setter methods, or class open
            if (res[i] === ';' || res[i] === '}' || res[i] === '{') {
              
              // append variable translate 
              res = res.substring(0, i+1) 
                  + ( (res[i] === '}' || res[i] === '{') ? '\n\n' : '\n' )
                  + translateImport[1] 
                  + (hasNewLine > 1 ? '' : '\n')
                  + res.substring(i+1, res.length);
              break;
            }
          }
        }
    
        // write translation in language file
        if (res.length > 0)
          writeOnFile(file, res);

      } catch (e) {

        // error with file TS
        console.error(e)
      }
      
    };

    // replace pipe on sentence
    const [ filePathHTML, filePathTS ] = [ filePath, filePath.replace('.html', '.ts') ];
    const languageFileData = JSON.parse(readOnFile(LANGUAGE_FILE, 'utf8'));
    let jsonContent = {};

    // to avoid sentence ABC replaced by sentence AB 
    sentenceList = sentenceList.sort((a, b) => (b.sentence.length - a.sentence.length));

    // generate list with key, sentence, pipe and index
    let keySentenceList = getKeySentencePipe(sentenceList, filePathHTML);

    // save all pipes length - help to replace sentences at right spot
    const n = keySentenceList.length;

    for (let i=0; i<n; i++) {
      
      // calculate right spot after pipe

      // issue: replace the pipe to every word (even CSS class or JS function name)
      
      // to replace the exact sentence we need to know the new index
      // because of the pipes of previous sentences
      let newIndex = ((obj) => {
        
        // recalculation needed because of \t, \r, \n 
        let idx = contentHTML.indexOf(obj.sentence, obj.index);
           
        // PLACEHOLDER
        if (obj.type === SENTENCE_TYPE.placeholder) {

          while (idx < contentHTML.length && idx != -1) {

            if (contentHTML.substring(idx-13, idx) === `placeholder="`)
              return idx;

            // go ahead - get next sentence occurrence
            idx = contentHTML.indexOf(obj.sentence, idx + obj.sentence.length);
          }
        }
        
        // PLACEHOLDER INPUT
        if (obj.type === SENTENCE_TYPE.placeholderInput) {

          while (idx < contentHTML.length && idx != -1) {

            if (contentHTML.substring(idx-16, idx) === `[placeholder]="'`)
              return idx;

            // go ahead - get next sentence occurrence
            idx = contentHTML.indexOf(obj.sentence, idx + obj.sentence.length);
          }
        }

        // SENTENCE
        // go to EOF to check newIndex is correct
        while (idx < contentHTML.length && idx != -1) {

          // todo
          // fix not-insert replace in pipe already existed
          
          // to exclude CSS-class/JS-function name check if '>' or space 
          if ( [ ...['>', ' '], ...ILLEGAL_CHARS ].includes(contentHTML[idx-1]) ) {
            
            // exclude pipe - find start of open tag
            for (let i=idx-1; i>0; i--) {
            
              // is valid sentence
              if (contentHTML[i] === '>') 
                return idx;

              // is pipe key
              if (contentHTML[i] === '|')
                break;
            }
          }

          // go ahead - get next sentence occurrence
          idx = contentHTML.indexOf(obj.sentence, idx + obj.sentence.length);
        }
        
        // if string not found
        return (idx !== -1) ? idx : 0;

      })( keySentenceList[i] );


      let sentenceToReplace = keySentenceList[i].sentence;
      
      // placeholder input take value with 'quote'
      if (keySentenceList[i].type === SENTENCE_TYPE.placeholderInput) {

        sentenceToReplace = `'${keySentenceList[i].sentence}'`;
        newIndex--;
      }
      
      // single replace after newIndex
      contentHTML = 
        contentHTML.substring(0, newIndex) + 
        contentHTML.substring(newIndex, contentHTML.length).replace(sentenceToReplace, keySentenceList[i].pipe);
      
      if (
        // already exists in LANGUAGE_FILE - no append
        !languageFileData[keySentenceList[i].key] &&
        // avoid duplicates key in LANGUAGE_FILE
        !jsonContent[keySentenceList[i].key]
      ) {

        // add row and map sentence and key in language file
        jsonContent[keySentenceList[i].key] = escapeDoubleQuote(keySentenceList[i].sentence);
      }
    }

    writeLanguageFile(jsonContent);
    writeOnFile(filePathHTML, contentHTML);
    writeImportPipeTS(filePathTS);
  };
  
  (() => {
  
    console.log(MSGS[0], MSGS[1]);

    const res = readDir(MODULE_PATH);
    
    for (const x of res) exec(x);
    
    console.log(MSGS[2], MSGS[3]);
  })();
};

// directories of your projects
const MODULES_LIST = [ ];
for (let x of MODULES_LIST) app(x);
