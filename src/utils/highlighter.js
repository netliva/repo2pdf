const hljs = require('highlight.js');

/**
 * Kod içeriğini syntax highlighting ile renklendirir
 * @param {string} code - Kaynak kod
 * @param {string} extension - Dosya uzantısı
 * @returns {Array} Renklendirilmiş satırlar
 */
function highlightCode(code, extension) {
  if (!code || typeof code !== 'string') {
    return [[]];
  }

  try {
    // Dil belirleme
    let language = '';
    switch (extension.toLowerCase()) {
      case 'js': language = 'javascript'; break;
      case 'jsx': language = 'javascript'; break;
      case 'ts': language = 'typescript'; break;
      case 'tsx': language = 'typescript'; break;
      case 'py': language = 'python'; break;
      case 'php': language = 'php'; break;
      case 'java': language = 'java'; break;
      case 'rb': language = 'ruby'; break;
      case 'go': language = 'go'; break;
      case 'cs': language = 'csharp'; break;
      case 'css': language = 'css'; break;
      case 'html': language = 'html'; break;
      case 'xml': language = 'xml'; break;
      case 'json': language = 'json'; break;
      case 'yaml': language = 'yaml'; break;
      case 'yml': language = 'yaml'; break;
      case 'md': language = 'markdown'; break;
      case 'sql': language = 'sql'; break;
      default: language = extension;
    }

    // Highlight.js ile renklendirme
    const result = language 
      ? hljs.highlight(code, { language })
      : hljs.highlightAuto(code);

    // Tüm HTML çıktısını tek seferde parse et
    const tokens = parseHighlightedHtml(result.value);
    // console.log('\n\ntokens :>> ', tokens.slice(0,30));
    // Satırlara böl
    const lines = [];
    let currentLine = [];
    let currentText = '';
    
    for (const token of tokens) {
      const tokenLines = token.text.split('\n');
      
      // Token'ın ilk satırını mevcut satıra ekle
      currentText += tokenLines[0];
      if (tokenLines.length === 1) {
        currentLine.push({
          text: tokenLines[0],
          fillColor: token.fillColor
        });
      } else {
        // Birden fazla satır varsa
        if (currentText.trim()) {
          currentLine.push({
            text: tokenLines[0],
            fillColor: token.fillColor
          });
        }
        lines.push(currentLine);
        
        // Orta satırları ekle
        for (let i = 1; i < tokenLines.length - 1; i++) {
          lines.push(tokenLines[i].trim() ? [{
            text: tokenLines[i],
            fillColor: token.fillColor
          }] : [{ text: '', fillColor: '#000000' }]);
        }
        
        // Son satırı yeni current line olarak başlat
        currentLine = tokenLines[tokenLines.length - 1].trim() ? [{
          text: tokenLines[tokenLines.length - 1],
          fillColor: token.fillColor
        }] : [{ text: '', fillColor: '#000000' }];
        currentText = tokenLines[tokenLines.length - 1];
      }
    }
    
    if (currentLine.length > 0) {
      lines.push(currentLine);
    }

    // console.log('\n\nlines :>> ', lines.slice(0,10));
    return lines.length > 0 ? lines : [[{ text: '', fillColor: '#000000' }]];

  } catch (error) {
    // console.error('Highlighting error:', error);
    return code.split('\n').map(line => [{
      text: line || '',
      fillColor: '#000000'
    }]);
  }
}

/**
 * HTML çıktısını parse eder
 */
function parseHighlightedHtml(html) {
  if (!html) {
    return [{ text: '', fillColor: '#000000' }];
  }




  const tokens = [];
  const regex = /<span class="hljs-([^"]+)">([^<]*)<\/span>|([^<]+)|<[^>]+>/g;
  let match;

  // console.log('\n\nhtml :>> ', html);

  while ((match = regex.exec(html)) !== null) {
     // console.log('\n\content :>> ', match[0]);
     // console.log('\n\nmatch :>> ', match[1],'|', match[2],'|', match[3]);

     if (match[3] && match[3].match(/^[\s\n]+$/)) {
         tokens.push({
             text: "\n",
             fillColor: '#000000'
            });
        } else if (match[3]) { // Normal metin
    if (match[3].trim()) {
        tokens.push({
          text: decodeHtmlEntities(match[3]),
          fillColor: '#000000'
        });
      }
    } else { // Renklendirilmiş token
      tokens.push({
        text: decodeHtmlEntities(match[2]),
        fillColor: getColor(match[1])
      });
    }
  }
  // console.log('tokens :>> ', tokens);
  return tokens.length > 0 ? tokens : [{ text: html, fillColor: '#000000' }];
}


function decodeHtmlEntities(str) {
    if (!str) return '';
    
    const entities = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#x27;': "'",
        '&#x60;': '`',
        '&nbsp;': ' ',
        '&#39;': "'",
        '&#34;': '"',
        '&#x2F;': '/',
        '&#x3D;': '=',
        '&#x3E;': '>',
        '&#x3C;': '<'
    };

    // HTML varlık kodlarını çöz
    str = str.replace(/&[#\w]+;/g, entity => {
        // Sayısal varlık kodları için
        if (entity.charAt(1) === '#') {
            const code = entity.charAt(2).toLowerCase() === 'x' ?
                parseInt(entity.substr(3), 16) :
                parseInt(entity.substr(2));
                
            if (!isNaN(code)) {
                return String.fromCharCode(code);
            }
        }
        // İsimlendirilmiş varlık kodları için
        return entities[entity] || entity;
    });

    return str;
}

/**
 * Token tipine göre renk döndürür
 */
function getColor(type) {
  switch (type) {
    case 'keyword': return '#0000FF';  // Mavi
    case 'string': return '#008000';   // Yeşil
    case 'comment': return '#808080';  // Gri
    case 'number': return '#FF0000';   // Kırmızı
    case 'function': return '#000080'; // Lacivert
    case 'class': return '#800080';    // Mor
    case 'built_in': return '#000080'; // Lacivert
    case 'literal': return '#0000FF';  // Mavi
    case 'variable': return '#000000'; // Siyah
    case 'operator': return '#000000'; // Siyah
    case 'punctuation': return '#000000'; // Siyah
    default: return '#000000';         // Siyah
  }
}

module.exports = {
  highlightCode
}; 