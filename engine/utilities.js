function namespace(code) {
  code()
}

// ---------------------------------------------------------------------------------------------------- //
//* data stuff
// ---------------------------------------------------------------------------------------------------- //

namespace(function() {

/*** Start cross-compatibility ***/
// Used to detect if IDs include a direction, e.g. resize-top-left
if (!String.prototype.includes) {
  String.prototype.includes = function() {
    return String.prototype.indexOf.apply(this, arguments) !== -1
  }
}
Event.prototype.movementX = Event.prototype.movementX || Event.prototype.mozMovementX
Event.prototype.movementY = Event.prototype.movementY || Event.prototype.mozMovementY
Event.prototype.isRightClick = function() {
  return this.which === 3 || (this.touches && this.touches.length > 1)
}
/*** End cross-compatibility ***/

// https://stackoverflow.com/q/12571650
window_onerror = window.onerror
window.onerror = function(message, url, line) {
  console.error(message, url, line)
}

var tracks = {
  'start':   './data/panel_start_tracing.aac',
  'success': './data/panel_success.aac',
  'fail':    './data/panel_failure.aac',
  'abort':   './data/panel_abort_tracing.aac',
}
var audio = new Audio(src='./data/panel_start_tracing.aac')

window.PLAY_SOUND = function(name) {
  audio.pause()
  audio.src = tracks[name]
  audio.volume = localStorage.volume
  audio.play()
}

// ---------------------------------------------------------------------------------------------------- //
//* enum stuff
// ---------------------------------------------------------------------------------------------------- //

window.LINE_NONE     = 0
window.LINE_BLACK    = 1
window.LINE_BLUE     = 2
window.LINE_YELLOW   = 3
window.DOT_NONE      = 0
window.DOT_BLACK     = 1
window.DOT_BLUE      = 2
window.DOT_YELLOW    = 3
window.DOT_INVISIBLE = 4
window.CUSTOM_DOTS   = 5
window.CUSTOM_CROSS               = -1
window.CUSTOM_CROSS_FILLED        = -2
window.CUSTOM_CROSS_BLUE          = -3
window.CUSTOM_CROSS_BLUE_FILLED   = -4
window.CUSTOM_CROSS_YELLOW        = -5
window.CUSTOM_CROSS_YELLOW_FILLED = -6
window.CUSTOM_CURVE               = -7
window.CUSTOM_CURVE_FILLED        = -8
window.CUSTOM_CURVE_BLUE          = -9
window.CUSTOM_CURVE_BLUE_FILLED   = -10
window.CUSTOM_CURVE_YELLOW        = -11
window.CUSTOM_CURVE_YELLOW_FILLED = -12
window.SOUND_DOT   = 40
window.CUSTOM_X = -13
window.GAP_NONE      = 0
window.GAP_BREAK     = 1
window.GAP_FULL      = 2
window.CUSTOM_LINE = 3

window.symbols = ['square', 'star', 'pentagon', 'triangle', 'arrow', 'dart', 'atriangle', 'vtriangle', 'blackhole', 'whitehole', 'divdiamond', 'pokerchip', 'bridge', 'scaler', 'sizer', 'twobytwo', 'poly', 'ylop', 'polynt', 'nega', 'copier', 'portal', 'celledhex', 'dice', 'xvmino', 'crystal', '!poly', '!ylop', '!polynt', '!xvmino', 'swirl', 'eye'];
window.polyominoes = ['poly', 'ylop', 'polynt', 'xvmino'];
window.endEnum = ['top', 'right', 'left', 'bottom'];
window.themeArgs = ['background', 'outer', 'inner', 'text', 'line-undone', 'line-default', 'line-success', 'line-primary', 'line-secondary'];
window.imageArgs = ['foreground-image', 'background-image', 'background-music', 'cursor-image', 'veil-image'];
window.symbolColors = ["#000000ff", "#00000080", "#00000000", "#ffffffff", "#ffffff80", "#ccccccff", "#ff0000ff", "#ff66b3ff", "#800000ff", "#ffa500ff", "#fa8f04ff", "#ff6666ff", "#ffff00ff", "#ffff80ff", "#cccc44ff", "#008000ff", "#b0ffb0ff",  "#3cd4d9ff", "#0000ffff", "#6867fdff", "#80ffffff", "#800080ff", "#8101ffff", "#ff07ffff", "#55556cff", "#b4b4c4ff", "#aa0000ff", "#ff4000ff", "#ffc900ff", "#00ff00ff", "#76a856ff", "#aa00aaff"];

// ---------------------------------------------------------------------------------------------------- //
//* animation stuff
// ---------------------------------------------------------------------------------------------------- //

var animations = ''
var l = function(line) {animations += line + '\n'}
// pointer-events: none; allows for events to bubble up (so that editor hooks still work)
l('.line-1 {')
l('  fill: var(--line-default);')
l('  pointer-events: none;')
l('}')
l('.line-2 {')
l('  fill: var(--line-primary);')
l('  pointer-events: none;')
l('}')
l('.line-3 {')
l('  fill: var(--line-secondary);')
l('  pointer-events: none;')
l('}')
l('@keyframes line-success {to {fill: var(--line-success);}}')
l('@keyframes line-fail {to {fill: var(--line-failure);}}')
l('@keyframes error {to {fill: red;}}')
l('@keyframes fade {to {opacity: 0.35;}}')
l('@keyframes start-grow { 0% {r: 12;} 100% {r: 24;} }')
// Neutral button style
l('#symboltheme, .loadButtonWrapper, button {')
l('  background-color: var(--outer);')
l('  border: 1px solid var(--border);')
l('  color: var(--text);')
l('  display: inline-block;')
l('  margin: 0px;')
l('  outline: none;')
l('  opacity: 1.0;')
l('  padding: 1px 6px;')
l('  -moz-appearance: none;')
l('  -webkit-appearance: none;')
l('}')
// Active (while held down) button style
l('#symboltheme:active, .loadButtonWrapper:active, button:active {filter: brightness(0.8);}')
// Disabled button style
l('#symboltheme:disabled, .loadButtonWrapper:disabled, button:disabled {opacity: 0.5;}')
// Selected button style (see https://stackoverflow.com/a/63108630)
l('#symboltheme:focus, .loadButtonWrapper:focus, button:focus {outline: none;}')
l = null

var style = document.createElement('style')
style.type = 'text/css'
style.title = 'animations'
style.appendChild(document.createTextNode(animations))
document.head.appendChild(style)

// ---------------------------------------------------------------------------------------------------- //
//* log stuff
// ---------------------------------------------------------------------------------------------------- //

// Custom logging to allow leveling
var consoleError = console.error
var consoleWarn = console.warn
var consoleInfo = console.log
var consoleLog = console.log
var consoleDebug = console.log
var consoleSpam = console.log
var consoleGroup = console.group
var consoleGroupEnd = console.groupEnd

window.setLogLevel = function(level) {
  console.error = function() {}
  console.warn = function() {}
  console.info = function() {}
  console.log = function() {}
  console.debug = function() {}
  console.spam = function() {}
  console.group = function() {}
  console.groupEnd = function() {}

  if (level === 'none') return

  // Instead of throw, but still red flags and is easy to find
  console.error = consoleError
  if (level === 'error') return

  // Less serious than error, but flagged nonetheless (Default for auto solves)
  console.warn = consoleWarn
  if (level === 'warn') return

  // Only shows validation data, useful for manual solves
  console.info = consoleInfo
  if (level === 'info') return

  // Useful for debugging (mainly validation)
  console.log = consoleLog
  if (level === 'log') return

  // Useful for serious debugging (mainly graphics/misc)
  console.debug = consoleDebug
  if (level === 'debug') return

  // Useful for insane debugging (mainly tracing/recursion)
  console.spam = consoleSpam
  console.group = consoleGroup
  console.groupEnd = consoleGroupEnd
  if (level === 'spam') return
}
setLogLevel('error') //! CHANGE THIS IN DEV

window.deleteElementsByClassName = function(rootElem, className) {
  var elems = []
  while (true) {
    elems = rootElem.getElementsByClassName(className)
    if (elems.length === 0) break;
    elems[0].remove()
  }
}

window.pathsToDir = function(rawPath) {  
  let res = "", path = [...rawPath];
  res += String.fromCharCode(path[0].x);
  res += String.fromCharCode(path[0].y);
  path[path.length - 1] = ['', 'left', 'right', 'top', 'bottom'].indexOf(puzzle.getCell(puzzle.endPoint.x, puzzle.endPoint.y).end);
  for (let i = 1; i < path.length; i += 4) {
    res += String.fromCharCode(
      ((Math.max(1, path[i  ]) - 1)     ) |
      ((Math.max(1, path[i+1]) - 1) << 2) |
      ((Math.max(1, path[i+2]) - 1) << 4) | 
      ((Math.max(1, path[i+3]) - 1) << 6)
    );
  }
  return res;
}

// ---------------------------------------------------------------------------------------------------- //
//* util stuff
// ---------------------------------------------------------------------------------------------------- //

window.hexToInt = function(hex) {
  return parseInt(hex.slice(1), 16);
}

window.intToHex = function(int) {
  return '#' + Number(int).toString(16).padStart(6, '0');
}

window.makeBitSwitch = function (...bits) {
  let cur = 1;
  let res = 0;
  for (const b of bits) {
    if (b) res += cur;
    cur <<= 1;
  }
  res += cur;
  return res;
}

window.readBitSwitch = function (bs) {
  let cur = 0;
  let res = [];
  while ((bs >> cur) > 1) {
    if ((bs >> cur) % 2) res.push(true);
    else res.push(false);
    cur++;
  }
  return res;
}

window.intToByte = function(...num) {
  return num.map(n => String.fromCharCode(((n & 0xff000000) >>> 24), ((n & 0x00ff0000) >>> 16), ((n & 0x0000ff00) >>> 8), n & 0x000000ff))};

window.byteToInt = function(...byte) {
  return byte.map(b => ((b.charCodeAt(0) << 24 >>> 0) + (b.charCodeAt(1) << 16 >>> 0) + (b.charCodeAt(2) << 8 >>> 0) + (b.charCodeAt(3) >>> 0)));
}

window.div = function(n, a) {
  return ((n - (n % a)) / a);
}

window.rdiv = function(n, a) {
  return ((n % a) + a) % a;
}

window.mdiv = function(n, a) {
  return n - (n % a);
}

const _keyStr = " 123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.-0"

window.runLength = function(str) {
  let res = "";
  let cur = '';
  let rep = 0;
  str += '!'; // terminate
  for (let i = 0; i < str.length; i++) {
    if (rep == 64) {
      res += '~0' + cur;
      rep = 0;
    }
    if (cur != str[i]) { 
      if (rep > 3) { 
        res += '~' + _keyStr[rep] + cur;
      }
      else res += cur.repeat(rep);
      cur = str[i]; rep = 1;
    } else rep++;
  }
  return res;
}

window.runLengthV2 = function(str) {
  let res = "";
  let cur = '';
  let rep = 0;
  str += '!'; // terminate
  //* STAGE 1: SINGLE LETTER RLE
  for (let i = 0; i < str.length; i++) {
    if (rep == 64) {
      res += '~~0' + cur;
      rep = 0;
    }
    if (cur != str[i]) { 
      if (rep > 4) { 
        res += '~~' + _keyStr[rep] + cur;
      }
      else res += cur.repeat(rep);
      cur = str[i]; rep = 1;
    } else rep++;
  }
  //* STAGE 2: 4 LETTER RLE
  str = res;
  res = "";
  cur = '';
  rep = 0;
  str += '!!!!'; // terminate
  for (let i = 0; i < str.length - 3;) {
    if (rep == 64) {
      res += '~0' + cur;
      rep = 0;
    }
    if (rep) {
      if (cur == str.slice(i, i+4)) {
        rep++;
        i += 4;
      } else {
        res += '~' + _keyStr[rep] + cur
        cur = '';
        rep = 0;
      }
    } else {
      if (str.slice(i, i+4) == str.slice(i+4, i+8)) {
        cur = str.slice(i, i+4)
        rep = 1;
        i += 4;
      }
      else {
        res += str[i];
        i++;
      }
    }
  }
  res = res.replace(/\!+/g, '');
  return res;
}

window.derunLength = function(str) {
  let res = ""
  for (let i = 0; i < str.length; i++) {
    if (str[i] == '~') {
      res += str[i+2].repeat(_keyStr.indexOf(str[i+1]));
      i += 2;
    }
    else res += str[i];
  }
  return res;
}

window.derunLengthV2 = function(str) {
  let res = ""
  for (let i = 0; i < str.length; i++) {
    if (str.slice(i, i+2) == '~~') {
      res += '~~';
      i++;
    } else if (str[i] == '~') {
      res += str.slice(i+2, i+6).repeat(_keyStr.indexOf(str[i+1]));
      i += 5;
    }
    else res += str[i];
  }
  str = res;
  res = "";
  for (let i = 0; i < str.length; i++) {
    if (str.slice(i, i+2) == '~~') {
      res += str[i+3].repeat(_keyStr.indexOf(str[i+2]));
      i += 3;
    }
    else res += str[i];
  }
  return res;
}

window.checkboxToggle = function(id, fn) {
  let checkbox = document.getElementById(id);
  checkbox.checked = !checkbox.checked
  checkbox.style.background = (checkbox.checked ? 'var(--text)' : 'var(--background)')
  if (fn) fn(checkbox.checked)
}

// ---------------------------------------------------------------------------------------------------- //
//* puzzle stuff
// ---------------------------------------------------------------------------------------------------- //

window.dotToSpokes = function(dot) {
  if (dot >= -12) return 0;
  else return (dot * -1) - 12
}

// Automatically solve the puzzle
window.solvePuzzle = function() {
  if (window.setSolveMode) window.setSolveMode(false)
  document.getElementById('solutionViewer').style.display = 'none'
  document.getElementById('progressBox').style.display = null
  document.getElementById('solveAuto').innerText = 'Cancel Solving'
  document.getElementById('solveAuto').onpointerdown = function() {
    this.innerText = 'Cancelling...'
    this.onpointerdown = null
    window.setTimeout(window.cancelSolving, 0)
  }

  window.solve(window.puzzle, function(percent) {
    document.getElementById('progressPercent').innerText = percent + '%'
    document.getElementById('progress').style.width = percent + '%'
  }, function(paths) {
    document.getElementById('progressBox').style.display = 'none'
    document.getElementById('solutionViewer').style.display = null
    document.getElementById('progressPercent').innerText = '0%'
    document.getElementById('progress').style.width = '0%'
    document.getElementById('solveAuto').innerText = 'Solve (automatically)'
    document.getElementById('solveAuto').onpointerdown = solvePuzzle

    window.puzzle.autoSolved = true
    paths = window.onSolvedPuzzle(paths)
    showSolution(window.puzzle, paths, 0)
  })
}

function showSolution(puzzle, paths, num) {
  var previousSolution = document.getElementById('previousSolution')
  var solutionCount = document.getElementById('solutionCount')
  var nextSolution = document.getElementById('nextSolution')

  if (paths.length === 0) { // 0 paths, arrows are useless
    solutionCount.innerText = '0 of 0'
    previousSolution.disabled = true
    nextSolution.disabled = true
    return
  }

  while (num < 0) num = paths.length + num
  while (num >= paths.length) num = num - paths.length

  if (paths.length === 1) { // 1 path, arrows are useless
    solutionCount.innerText = '1 of 1'
    if (paths.length >= window.MAX_SOLUTIONS) solutionCount.innerText += '+'
    previousSolution.disabled = true
    nextSolution.disabled = true
  } else {
    solutionCount.innerText = (num + 1) + ' of ' + paths.length
    if (paths.length >= window.MAX_SOLUTIONS) solutionCount.innerText += '+'
    previousSolution.disabled = false
    nextSolution.disabled = false
    previousSolution.onpointerdown = function(event) {
      if (event.shiftKey) {
        showSolution(puzzle, paths, num - 10)
      } else {
        showSolution(puzzle, paths, num - 1)
      }
    }
    nextSolution.onpointerdown = function(event) {
      if (event.shiftKey) {
        showSolution(puzzle, paths, num + 10)
      } else {
        showSolution(puzzle, paths, num + 1)
      }
    }
  }

  if (paths[num] != null) {
    // Save the current path on the puzzle object (so that we can pass it along with publishing)
    puzzle.path = paths[num]
    // Draws the given path, and also updates the puzzle to have path annotations on it.
    window.drawPath(puzzle, paths[num])
  }
}

window.copyTheme = function(puzzle) {
  puzzle.theme = {};
  for (entry of themeArgs) {
    puzzle.theme[entry] = hexToInt(getComputedStyle(document.documentElement).getPropertyValue('--' + entry));
  }
}

window.applyTheme = function(puzzle) {
  for (entry of Object.entries(puzzle.theme)) {
    document.documentElement.style.setProperty('--' + entry[0], intToHex(entry[1]));
  }
}

window.copyImage = function(puzzle) {
  puzzle.image = {};
  for (entry of imageArgs) {
    let res = getComputedStyle(document.documentElement).getPropertyValue('--' + entry);
    if (res == 'none') puzzle.image[entry] = null;
    else puzzle.image[entry] = res.slice(4, -1);
  }
}

window.applyImage = function(puzzle) {
  for (entry of Object.entries(puzzle.image)) {
    if (entry[1] == null) document.documentElement.style.setProperty('--' + entry[0], 'none');
    else document.documentElement.style.setProperty('--' + entry[0], `url(${entry[1]})`);
  }
}

window.serializeTheme = function(puzzle) {
  let ints = [];
  for (const entry of themeArgs) ints.push(puzzle.theme[entry]);
  return 'vt1_' + runLength(btoa(themeArgs.map(x => intToByte(x)[0]).join('') + imageArgs.map(x => (puzzle.image[x] ?? '')).join('\u0000')).replace(/\+/g, '.').replace(/\//g, '-').replace(/=/g, '_'));
}

window.deserializeTheme = function(puzzle, string) {
  let veri = string.indexOf('_');
  let version = string.slice(0, veri);
  string = string.slice(veri + 1);
  if (version == 'vt1') deserializeThemeV1(puzzle, string);
  else throw Error('unknown theme format');
}

function deserializeThemeV1(puzzle, string) {
  let raw = atob(derunLength(string).replace(/\./g, '+').replace(/-/g, '/').replace(/_/g, '='));
  puzzle.theme = {};
  let i = 0;
  for (const entry of themeArgs) {
    let char = byteToInt(raw.slice(i, i+4))[0];
    puzzle.theme[entry] = char;
    i += 4;
  }
  for (const entry of raw.slice(i).split('\u0000')) {
    puzzle.image = {};
    for (let i = 0; i < imageArgs.length; i++)
      puzzle.image[imageArgs[i]] = (entry[i]?.length ? entry[i] : null);
  }
  window.puzzle = puzzle;
  applyTheme(puzzle);
  applyImage(puzzle);
}

const SCHEMA = new Map([
  ['height', 'byte'],
  ['width', 'byte'],
  ['sols', 'byte'], //* if sols=0, perfect=true
  ['symmetry', 'byte'], //* pillar.x, pillar.y, (symmetry.xmode, symmetry.ymode)[TERNARY, 4(8<9<16)], symmetry.90
  ['flags', 'byte'], //* disableFlash, optional
  ['translateX', 'int'], //* in pixel
  ['translateY', 'int'], //* in pixel
  ['perspective', 'int'], //* in pixel
  ['rotateX', 'byte'], //* -45 to 45, in degree
  ['rotateY', 'byte'], //* -45 to 45, in degree
  ['scaleX', 'int'], //* in %
  ['scaleY', 'int'], //* in %
  ['skewX', 'byte'], //* -90 to 90, in degree
  ['skewY', 'byte'], //* -90 to 90, in degree
  ['endA', 'byte'], //* if 0, next puzzle
  ['endB', 'byte'], //* if 0, next puzzle
  ['endC', 'byte'], //* if 0, next puzzle
  ['theme.background', 'int'],
  ['theme.inner', 'int'],
  ['theme.outer', 'int'],
  ['theme.line-default', 'int'],
  ['theme.line-primary', 'int'],
  ['theme.line-secondary', 'int'],
  ['theme.line-success', 'int'],
  ['theme.line-undone', 'int'],
  ['theme.text', 'int'],
  ['defaultCorner', 'corner'], //* only if majority of corner is same dot/gap/start, else null
  ['defaultCell', 'cell'],
  ['corners', 'sparse[]<corner>'],
  ['soundDots', '[]<byte>'],
  ['cells', 'sparse[]<cell>'],
  ['image.background-image', 'string'],
  ['image.foreground-image', 'string'],
  ['image.background-music', 'string'],
  ['image.cursor-image', 'string'],
  ['image.veil-image', 'string'],
]);

/**
 *! Cell data structure
 ** type: type,
 ** color: byte,
  // optional - count
 ** ['triangle', 'arrow', 'dart', 'atriangle', 'divdiamond', 'dice', 'crystal', 'eye']: count: byte
 ** ['arrow', 'dart']:: count += (4 * dir)
  // optional - flip
 ** ['scaler', 'swirl']: flip: byte
  // optional - poly
 ** ['poly', 'ylop', 'polynt', 'xvmino']: polyshape: int (canRotate built into cell type)!!
 */

/**
 *! Corner data structure
 ** dot: byte (dot info)
 ** start: byte (startx3, endx3 (direction + null), gap, endType<A, B, C>);
 */

window.serializePuzzle = function(puzzle) {
  let raw = "";
  //* header
  raw += String.fromCharCode(Math.floor(puzzle.width / 2));
  raw += String.fromCharCode(Math.floor(puzzle.height / 2));
  raw += String.fromCharCode(makeBitSwitch(puzzle.pillar[0], puzzle.pillar[1], puzzle.symmetry[0] + (puzzle.symmetry[1] * 3), 0, 0, 0, puzzle.symmetry[2]));
  raw += String.fromCharCode(makeBitSwitch(puzzle.disableFlash, puzzle.optional));
  raw += String.fromCharCode(Math.min(0xff, puzzle.sols ?? 1));
  raw += intToByte(puzzle.transform.translate[0])[0];
  raw += intToByte(puzzle.transform.translate[1])[0];
  raw += intToByte(puzzle.transform.perspective)[0];
  raw += String.fromCharCode(puzzle.transform.rotate[0] + 45);
  raw += String.fromCharCode(puzzle.transform.rotate[1] + 45);
  raw += intToByte(puzzle.transform.scale[0])[0];
  raw += intToByte(puzzle.transform.scale[1])[0];
  raw += String.fromCharCode(puzzle.transform.skew[0] + 90);
  raw += String.fromCharCode(puzzle.transform.skew[1] + 90);
  raw += String.fromCharCode(puzzle.endDest[0]);
  raw += String.fromCharCode(puzzle.endDest[1]);
  raw += String.fromCharCode(puzzle.endDest[2]);
  let ints = [];
  for (const entry of themeArgs) ints.push(puzzle.theme[entry]);
  raw += intToByte(...ints).join('');
  //* defaultCorner
  let med = {};
  for (let i = 0; i < puzzle.width / 2; i++) for (let j = 0; j < puzzle.height / 2; j++) {
    if (puzzle.grid[i*2]?.[j*2] === undefined) continue;
    let dot = getCornerData(puzzle.grid[i*2][j*2]);
    if (dot[1] != '\0') continue;
    med[dot] ??= 0; med[dot]++;
  }
  let defCorner = "\0\0";
  for (let k in med) if (med[k] >= (puzzle.width * puzzle.height / 8)) defCorner = k;
  raw += defCorner[0];
  //* defaultCell
  med = {};
  for (let i = 0; i < puzzle.width / 2; i++) for (let j = 0; j < puzzle.height / 2; j++) {
    if (puzzle.grid[i*2+1]?.[j*2+1] === undefined) continue;
    let data = getCellData(puzzle.grid[i*2+1][j*2+1]);
    med[data] ??= 0; med[data]++;
  }
  let defCell = "\0";
  for (let k in med) if (med[k] >= (puzzle.height * puzzle.width / 8)) defCell = k;
  raw += defCell;
  //* corners
  let corner = ["", "", ""];
  for (let i = 0; i < puzzle.width; i++) for (let j = 0; j < puzzle.height; j++) {
    if ((i % 2) && (j % 2) || !puzzle.grid[i]?.[j]) continue;
    let data = getCornerData(puzzle.grid[i][j]);
    if (!((i % 2) || (j % 2))) { if (data == defCorner) continue; }
    else if (data == '\0\0') continue;
    corner[0] += String.fromCharCode(i);
    corner[1] += String.fromCharCode(j);
    corner[2] += data;
  }
  raw += String.fromCharCode((corner[0].length & 0xFF00) << 8) + String.fromCharCode(corner[0].length & 0xFF);
  raw += corner[0];
  raw += corner[1];
  raw += corner[2];
  //* soundData
  raw += String.fromCharCode(puzzle.soundDots.length);
  for (let i = 0; i < puzzle.soundDots.length; i++) raw += String.fromCharCode(puzzle.soundDots[i]);
  //* cells
  let cell = ["", "", ""];
  for (let i = 0; i < puzzle.width / 2; i++) for (let j = 0; j < puzzle.height / 2; j++) {
    if (puzzle.grid[i*2+1]?.[j*2+1] === undefined) continue;
    let data = getCellData(puzzle.grid[i*2+1][j*2+1]);
    if (defCell == data) continue;
    cell[0] += String.fromCharCode(i);
    cell[1] += String.fromCharCode(j);
    cell[2] += data;
  }
  raw += String.fromCharCode((cell[0].length & 0xFF00) << 8) + String.fromCharCode(cell[0].length & 0xFF);
  raw += cell[0];
  raw += cell[1];
  raw += cell[2];
  //* image
  let zeroes = 0;
  for (let i = 0; i < imageArgs.length; i++) if (puzzle.image[imageArgs[i]]) {
    while (zeroes < i) { raw += '\0'; zeroes++; }
    raw += puzzle.image[imageArgs[i]];
  }
  return 'v6_' + runLength(btoa(raw).replace(/\+/g, '.').replace(/\//g, '-').replace(/\=/g, '_'));
}

function getCellData(cell) {
  let raw = "";
  if (!cell) return "\0";
  if (polyominoes.includes(cell.type) && (cell.polyshape & 1048576)) cell.type = '!' + cell.type;
  let type = window.symbols.indexOf(cell.type) + 2;
  if (cell.type[0] == '!') cell.type = cell.type.slice(1);
  raw += String.fromCharCode(type);
  raw += String.fromCharCode(cell.color);
  let count = 0;
  if (['triangle', 'arrow', 'dart', 'atriangle', 'divdiamond', 'dice', 'crystal', 'eye'].includes(cell.type)) count += cell.count;
  if (['arrow', 'dart'].includes(cell.type)) count = count * 8 + cell.rot;
  if (['scaler', 'swirl'].includes(cell.type)) raw += String.fromCharCode(!!cell.flip);
  if (count) raw += String.fromCharCode(count);
  if (polyominoes.includes(cell.type)) {
    raw += String.fromCharCode((cell.polyshape & 0xFF00) >> 8);
    raw += String.fromCharCode((cell.polyshape & 0xFF));
  }
  return raw;
}

function getCornerData(cell) {
  if (cell == null) return "\0\0";
  let dot = cell.dot ? cell.dot + 29 : 0;
  let start = endEnum.indexOf(cell.end) + 1 + (!!cell.start << 3) + ((cell.gap ?? 0) << 4) + ((cell.endType ?? 0) << 6);
  return String.fromCharCode(dot) + String.fromCharCode(start);
}

window.readRawArray = function(str) {
  return str.split('').map(x => x.charCodeAt(0));
}

window.deserializePuzzle = function(string) {
  let veri = string.indexOf('_');
  let version = string.slice(0, veri);
  string = string.slice(veri + 1);
  if (version == 'v2') return deserializePuzzleV2(deserializePuzzlePre(string));
  else if (version == 'v3') return deserializePuzzleV3(deserializePuzzlePre(string));
  else if (version == 'v4') return deserializePuzzleV4(deserializePuzzlePre(string));
  else if (version == 'v5') return deserializePuzzleV5(deserializePuzzlePre(string));
  else if (version == 'v6') return deserializePuzzleV6(deserializePuzzlePre(string));
  else throw Error('unknown puzzle format');
}

function deserializePuzzlePre(string) {
  return atob(derunLength(string).replace(/\./g, '+').replace(/\-/g, '/').replace(/\_/g, '='));
}

function deserializePuzzleV6(raw) {
  let ptr = 0;
  //* header
  let char = readBitSwitch(raw.charCodeAt(ptr+2));
  let puzzle = new Puzzle(raw.charCodeAt(ptr), raw.charCodeAt(ptr+1), [char[0], char[1]]);
  ptr += 3;
  let sym = ((char & 0x3C) >> 2)
  puzzle.symmetry = [sym % 3, sym / 3, char[6]];
  char = readBitSwitch(raw.charCodeAt(ptr));
  if (char[0]) puzzle.disableFlash = true;
  if (char[1]) puzzle.optional = true;
  ptr++;
  puzzle.sols = raw.charCodeAt(ptr);
  ptr++;
  puzzle.transform.translate = [byteToInt(raw.slice(ptr, ptr + 4))[0], byteToInt(raw.slice(ptr + 4, ptr + 8))[0]];
  ptr += 8;
  puzzle.transform.perspective = byteToInt(raw.slice(ptr, ptr + 4))[0];
  ptr += 4;
  puzzle.transform.rotate = [raw.charCodeAt(ptr) - 45, raw.charCodeAt(ptr + 1) - 45];
  ptr += 2;
  puzzle.transform.scale = [byteToInt(raw.slice(ptr, ptr + 4))[0], byteToInt(raw.slice(ptr + 4, ptr + 8))[0]];
  ptr += 8;
  puzzle.transform.skew = [raw.charCodeAt(ptr) - 90, raw.charCodeAt(ptr + 1) - 90];
  ptr += 2;
  puzzle.endDest = [raw.charCodeAt(ptr), raw.charCodeAt(ptr + 1), raw.charCodeAt(ptr + 2)];
  ptr += 3;
  //* style
  for (const entry of themeArgs) {
    char = byteToInt(raw.slice(ptr, ptr + 4))[0];
    puzzle.theme[entry] = char;
    ptr += 4;
  }
  [puzzle, ptr] = deserializePuzzleV4Core(raw, ptr, puzzle);
  //* image
  let urls = raw.slice(ptr).split('\0');
  for (let i = 0; i < imageArgs.length; i++) 
    if (urls[i]?.length) puzzle.image[imageArgs[i]] = urls[i];
  window.puzzle = puzzle;
  applyTheme(puzzle);
  applyImage(puzzle);
  return puzzle;
}

function deserializePuzzleV5(raw) {
  let ptr = 0;
  //* header
  let char = readBitSwitch(raw.charCodeAt(ptr+1));
  let puzzle = new Puzzle(raw.charCodeAt(ptr+2), raw.charCodeAt(ptr+3), [char[3], false]);
  puzzle.sols = raw.charCodeAt(ptr);
  ptr += 4;
  if (char[0]) puzzle.symmetry = [char[1], char[2], false];
  if (char[0] && !char[1] && !char[2]) puzzle.symmetry = [2, 0, false];
  if (char[4]) puzzle.sols = 0;
  if (char[5]) puzzle.disableFlash = true;
  if (char[6]) puzzle.optional = true;
  //* style
  for (const entry of themeArgs) {
    char = byteToInt(raw.slice(ptr, ptr + 4))[0];
    puzzle.theme[entry] = char;
    ptr += 4;
  }
  [puzzle, ptr] = deserializePuzzleV4Core(raw, ptr, puzzle);
  //* image
  let urls = raw.slice(ptr).split('\0');
  for (let i = 0; i < imageArgs.length; i++) 
    if (urls[i]?.length) puzzle.image[imageArgs[i]] = urls[i];
  window.puzzle = puzzle;
  applyTheme(puzzle);
  applyImage(puzzle);
  return puzzle;
}

function deserializePuzzleV4(raw) {
  //* header
  let char = readBitSwitch(raw.charCodeAt(1));
  let puzzle = new Puzzle(raw.charCodeAt(2), raw.charCodeAt(3), [char[3], false]);
  puzzle.sols = raw.charCodeAt(0);
  if (char[0]) puzzle.symmetry = [char[1], char[2], false];
  if (char[0] && !char[1] && !char[2]) puzzle.symmetry = [2, 0, false];
  if (char[4]) puzzle.sols = 0;
  if (char[5]) puzzle.disableFlash = true;
  if (char[6]) puzzle.optional = true;
  let ptr = 4;
  [puzzle, ptr] = deserializePuzzleV4Core(raw, ptr, puzzle);
  //* style
  for (const entry of themeArgs) {
    char = byteToInt(raw.slice(ptr, ptr + 4))[0];
    puzzle.theme[entry] = char;
    ptr += 4;
  }
  //* image
  let urls = raw.slice(ptr).split('\0');
  for (let i = 0; i < imageArgs.length; i++) 
    if (urls[i]?.length) puzzle.image[imageArgs[i]] = urls[i];
  window.puzzle = puzzle;
  applyTheme(puzzle);
  applyImage(puzzle);
  return puzzle;
}

function deserializePuzzleV4Core(raw, ptr, puzzle) {  
  //* defaults
  let defCorner = raw.charCodeAt(ptr);
  if (defCorner) for (let i = 0; i < puzzle.width / 2; i++) for (let j = 0; j < puzzle.height / 2; j++) puzzle.grid[i*2][j*2] = cornerData(defCorner, 0);
  ptr++;
  let defCell = raw.charCodeAt(ptr);
  if (defCell) {
    ptr++;
    let temp = cellData(defCell, raw.charCodeAt(ptr), raw.charCodeAt(ptr + 1), raw.charCodeAt(ptr + 2));
    for (let i = 0; i < puzzle.width / 2; i++) for (let j = 0; j < puzzle.height / 2; j++) {
      if (puzzle.grid[i*2+1]?.[j*2+1] === undefined) continue;
      puzzle.grid[i*2+1][j*2+1] = temp[0];
    } 
    ptr += temp[1];
  }
  ptr++;
  //* corners
  let x = [], y = [];
  let lenCorner = (raw.charCodeAt(ptr) >> 8) + (raw.charCodeAt(ptr + 1));
  ptr += 2;
  for (let i = 0; i < lenCorner; i++) { y.push(raw.charCodeAt(ptr)); ptr++; }
  for (let i = 0; i < lenCorner; i++) { x.push(raw.charCodeAt(ptr)); ptr++; }
  for (let i = 0; i < lenCorner; i++) { 
    puzzle.grid[y[i]][x[i]] = cornerData(raw.charCodeAt(ptr), raw.charCodeAt(ptr + 1));
    ptr += 2; 
  }
  //* soundData
  puzzle.soundDots = [];
  let lenSoundDots = raw.charCodeAt(ptr);
  ptr++;
  for (let i = 0; i < lenSoundDots; i++) {
    puzzle.soundDots.push(raw.charCodeAt(ptr));
    ptr++;
  }
  //* cells
  x = []; y = [];
  let lenCell = (raw.charCodeAt(ptr) >> 8) + (raw.charCodeAt(ptr + 1));
  ptr += 2;
  for (let i = 0; i < lenCell; i++) { y.push(raw.charCodeAt(ptr)); ptr++; }
  for (let i = 0; i < lenCell; i++) { x.push(raw.charCodeAt(ptr)); ptr++; }
  for (let i = 0; i < lenCell; i++) { 
    let temp = cellData(raw.charCodeAt(ptr), raw.charCodeAt(ptr + 1), raw.charCodeAt(ptr + 2), raw.charCodeAt(ptr + 3));
    puzzle.grid[y[i]*2+1][x[i]*2+1] = temp[0];
    ptr += 2 + temp[1]; 
  }
  return [puzzle, ptr];
}

function cellData(type, color, data1, data2) {
  if (!type) return [null, -1];
  let ret = {'type': symbols[type - 2], 'color': color};
  switch (ret.type) {
    case 'scaler':
    case 'swirl':
      ret.flip = !!data1;
      return [ret, 1];
    case 'arrow':
    case 'dart':
      ret.rot = data1 & 0x7;
      data1 >>= 3;
    case 'triangle':
    case 'atriangle':
    case 'divdiamond':
    case 'dice':
    case 'crystal':
    case 'eye':
      ret.count = data1;
      return [ret, 1];
    case 'poly':
    case 'ylop':
    case 'polynt':
    case 'xvmino':
    case '!poly':
    case '!ylop':
    case '!polynt':
    case '!xvmino':
      ret.polyshape = (data1 << 8) | data2;
      if (ret.type[0] == '!') {
        ret.type = ret.type.slice(1);
        ret.polyshape |= 1048576;
      }
      return [ret, 2];
    default:
      return [ret, 0];
  }
}

function cornerData(dot, start) {
  let ret = {'type': 'line', 'line': 0};
  if (dot) ret.dot = dot - 29;
  if (start & 0x7) ret.end = endEnum[(start & 0x7) - 1]
  if ((start & 0xF) >> 3) ret.start = true;
  if ((start & 0x3F) >> 4) ret.gap = ((start & 0x3F) >> 4);
  if (start >> 6) ret.endType = (start >> 6);
  return ret;
}

function deserializePuzzleV3(raw) {
  return deserializePuzzleV2(raw.slice(1), raw.charCodeAt(0));
}

function deserializePuzzleV2(raw, sols=1) {
  let i = 2;
  let char = readBitSwitch(raw.charCodeAt(i));
  let puzzle = new Puzzle(raw.charCodeAt(0), raw.charCodeAt(1), [char[3], false]);
  puzzle.sols = sols;
  if (char[0]) puzzle.symmetry = [char[1], char[2], false];
  if (char[0] && !char[1] && !char[2]) puzzle.symmetry = [2, 0, false];
  let x = -1; y = 0;
  while (true) {
    x++;
    if (x == puzzle.width) {
      x = 0; y++;
    }
    i++; char = raw.charCodeAt(i);
    if (char == 0xff) break;
    let cell = {};
    if (x % 2 == 0 || y % 2 == 0) { // line
      cell.type = 'line';
      if (char == 0x00) continue;
      // read additional data
      let dot = 6 - char
      if (dot) cell.dot = dot;
      i++; char = raw.charCodeAt(i);
      if (char >= 10) cell.gap = Math.floor(char / 10); char %= 10;
      if (char >= 5) cell.start = !!(Math.floor(char / 5)); char %= 5;
      if (char) cell.end = endEnum[char - 1];
      puzzle.grid[x][y] = cell;
      continue;
    }
    if (char == 0x00) {
      puzzle.grid[x][y] = null;
      continue;
    }
    cell.type = symbols[char - 1];
    i++;
    cell.color = symbolColors.indexOf('#' + Number(byteToInt(raw.slice(i, i+4))[0]).toString(16).padStart(8, '0'));
    i += 4; char = raw.charCodeAt(i);
    switch (cell.type) {
      case 'arrow':
      case 'dart':
        cell.rot = char % 8; char = Math.floor(char / 8);
      case 'triangle':
      case 'atriangle':
      case 'divdiamond':
        cell.count = char;
        break;
      case 'scaler':
      case 'swirl':
        cell.flip = !!char;
        break;
      case 'poly':
      case 'ylop':
      case 'polynt':
        cell.polyshape = byteToInt(raw.slice(i, i+4))[0];
        i += 3;
        break;
      default:
        i--;
        break;
    }
    puzzle.grid[x][y] = cell;
  }
  for (const entry of themeArgs) {
    char = byteToInt(raw.slice(i+1, i+5))[0];
    puzzle.theme[entry] = char;
    i += 4;
  }
  i++;
  let entry = raw.slice(i).split('\u00ff')
  puzzle.image['background-image'] = (entry[0]?.length ? entry[0] : null);
  puzzle.image['foreground-image'] = (entry[1]?.length ? entry[1] : null);
  window.puzzle = puzzle;
  applyTheme(puzzle);
  applyImage(puzzle);
  return puzzle;
}

const base = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzゝぁあぃいぅうぇえぉおゕかきくゖけこさしすせそたちっつてとなにぬねのはひふへほまみむめもゃやゅゆょよらりるれろゎわゐゑをんヽァアィイゥウェエォオヵカキㇰクヶケコサㇱシㇲスセソタチッツテㇳトナニㇴヌネノㇵハㇶヒㇷフㇸヘㇹホマミㇺムメモャヤュユョヨㇻラㇼリㇽルㇾレㇿロヮワヰヱヲンㄅㆠㄆㆴㄇㄈㄪㄉㄊㆵㄋㄌㄍㆣㄎㆶㄫㆭㄏㆷㄐㆢㄑㄒㄬㄓㄔㄕㄖㄗㆡㄘㄙㄚㆩㄛㆧㆦㄜㄝㆤㆥㄞㆮㄟㄠㆯㄡㄢㄣㄤㆲㄥㆰㆱㆬㄦㄧㆪㆳㄨㆫㆨㄩæɓƃƈđɖɗƌðǝəɛƒǥɠɣƣƕħıɨɩƙłƚɲƞŋœøɔɵȣƥʀʃŧƭʈɯʊʋƴƶȥʒƹȝþƿƨƽƅʔɐɑɒʙƀɕʣʥʤɘɚɜɝɞʚɤʩɡɢʛʜɦɧɪʝɟʄʞʪʫʟɫɬɭɮƛʎɱɴɳɶɷɸʠĸɹɺɻɼɽɾɿʁʂƪʅʆʨƾʦʧƫʇʉɥɰʌʍʏƍʐʑƺʓƻʕʡʢʖǀǁǂǃʗʘʬʭαβγδεϝϛζηθικλμνξοπϟϙρστυφχψωϡϳϗаәӕбвгґғҕдԁђԃҙеєжҗзԅѕӡԇиҋіјкқӄҡҟҝлӆљԉмӎнӊңӈҥњԋоөпҧҁрҏсԍҫтԏҭћуүұѹфхҳһѡѿѽѻцҵчҷӌҹҽҿџшщъыьҍѣэюяѥѧѫѩѭѯѱѳѵҩӀ҃҄҅҆֊ᐁᐂᐃᐄᐅᐆᐇᐈᐉᐊᐋᐌᐍᐎᐏᐐᐑᐒᐓᐔᐕᐖᐗᐘᐙᐚᐛᐜᐝᐞᐟᐠᐡᐢᐣᐤᐥᐦᐧᐨᐩᐪᐫᐬᐭᐮᐯᐰᐱᐲᐳᐴᐵᐶᐷᐸᐹᐺᐻᐼᐽᐾᐿᑀᑁᑂᑃᑄᑅᑆᑇᑈᑉᑊᑋᑌᑍᑎᑏᑐᑑᑒᑓᑔᑕᑖᑗᑘᑙᑚᑛᑜᑝᑞᑟᑠᑡᑢᑣᑤᑥᑦᑧᑨᑩᑪᑫᑬᑭᑮᑯᑰᑱᑲᑳᑴᑵᑶᑷᑸᑹᑺᑻᑼᑽᑾᑿᒀᒁᒂᒃᒄᒅᒆᒇᒈᒉᒊᒋᒌᒍᒎᒏᒐᒑᒒᒓᒔᒕᒖᒗᒘᒙᒚᒛᒜᒝᒞᒟᒠᒡᒢᒣᒤᒥᒦᒧᒨᒩᒪᒫᒬᒭᒮᒯᒰᒱᒲᒳᒴᒵᒶᒷᒸᒹᒺᒻᒼᒽᒾᒿᓀᓁᓂᓃᓄᓅᓆᓇᓈᓉᓊᓋᓌᓍᓎᓏᓐᓑᓒᓓᓔᓕᓖᓗᓘᓙᓚᓛᓜᓝᓞᓟᓠᓡᓢᓣᓤᓥᓦᓧᓨᓩᓪᓫᓬᓭᓮᓯᓰᓱᓲᓳᓴᓵᓶᓷᓸᓹᓺᓻᓼᓽᓾᓿᔀᔁᔂᔃᔄᔅᔆᔇᔈᔉᔊᔋᔌᔍᔎᔏᔐᔑᔒᔓᔔᔕᔖᔗᔘᔙᔚᔛᔜᔝᔞᔟᔠᔡᔢᔣᔤᔥᔦᔧᔨᔩᔪᔫᔬᔭᔮᔯᔰᔱᔲᔳᔴᔵᔶᔷᔸᔹᔺᔻᔼᔽᔾᔿᕀᕁᕂᕃᕄᕅᕆᕇᕈᕉᕊᕋᕌᕍᕎᕏᕐᕑᕒᕓᕔᕕᕖᕗᕘᕙᕚᕛᕜᕝᕞᕟᕠᕡᕢᕣᕤᕥᕦᕧᕨᕩᕪᕫᕬᕭᕮᕯᕰᕱᕲᕳᕴᕵᕶᕷᕸᕹᕺᕻᕽᙯᕾᕿᖀᖁᖂᖃᖄᖅᖆᖇᖈᖉᖊᖋᖌᖍᙰᖎᖏᖐᖑᖒᖓᖔᖕᙱᙲᙳᙴᙵᙶᖖᖗᖘᖙᖚᖛᖜᖝᖞᖟᖠᖡᖢᖣᖤᖥᖦᕼᖧᖨᖩᖪᖫᖬᖭᖮᖯᖰᖱᖲᖳᖴᖵᖶᖷᖸᖹᖺᖻᖼᖽᖾᖿᗀᗁᗂᗃᗄᗅᗆᗇᗈᗉᗊᗋᗌᗍᗎᗏᗐᗑᗒᗓᗔᗕᗖᗗᗘᗙᗚᗛᗜᗝᗞᗟᗠᗡᗢᗣᗤᗥᗦᗧᗨᗩᗪᗫᗬᗭᗮᗯᗰᗱᗲᗳᗴᗵᗶᗷᗸᗹᗺᗻᗼᗽᗾᗿᘀᘁᘂᘃᘄᘅᘆᘇᘈᘉᘊᘋᘌᘍᘎᘏᘐᘑᘒᘓᘔᘕᘖᘗᘘᘙᘚᘛᘜᘝᘞᘟᘠᘡᘢᘣᘤᘥᘦᘧᘨᘩᘪᘫᘬᘭᘮᘯᘰᘱᘲᘳᘴᘵᘶᘷᘸᘹᘺᘻᘼᘽᘾᘿᙀᙁᙂᙃᙄᙅᙆᙇᙈᙉᙊᙋᙌᙍᙎᙏᙐᙑᙒᙓᙔᙕᙖᙗᙘᙙᙚᙛᙜᙝᙞᙟᙠᙡᙢᙣᙤᙥᙦᙧᙨᙩᙪᙫᙬᚁᚂᚃᚄᚅᚆᚇᚈᚉᚊᚋᚌᚍᚎᚏᚐᚑᚒᚓᚔᚕᚖᚗᚘᚙᚚᚠᚡᚢᚤᚥᚦᚧᛰᚨᚩᚬᚭᚮᚯᚰᚱᚲᚳᚴᚵᚶᚷᚹᛩᚺᚻᚼᚽᚾᚿᛀᛁᛂᛃᛄᛅᛆᛮᛇᛈᛕᛉᛊᛋᛪᛌᛍᛎᛏᛐᛑᛒᛓᛔᛖᛗᛘᛙᛯᛚᛛᛜᛝᛞᛟᚪᚫᚣᛠᛣᚸᛤᛡᛢᛥᛦᛧᛨ᠐᠑᠒᠓᠔᠕᠖᠗᠘᠙ᢀᢁᢂᢃᢄᢅᢆᡃᠠᢇᠡᡄᡝᠢᡅᡞᡳᢈᡟᠣᡆᠤᡇᡡᠥᡈᠦᡉᡠᠧᠨᠩᡊᡢᢊᢛᠪᡋᠫᡌᡦᠬᡍᠭᡎᡤᢚᡥᠮᡏᠯᠰᠱᡧᢜᢝᢢᢤᢥᠲᡐᡨᠳᡑᡩᠴᡒᡱᡜᢋᠵᡓᡪᡷᠶᡕᡲᠷᡵᠸᡖᠹᡫᡶᠺᡗᡣᡴᢉᠻᠼᡔᡮᠽᡯᡘᡬᠾᡙᡭᠿᡀᡁᡂᡚᡛᡰᢌᢞᢍᢎᢟᢏᢐᢘᢠᢑᢡᢒᢓᢨᢔᢣᢕᢙᢖᢗᢦᢧᢩաբգդեզէըթժիլխծկհձղճմյնշոչպջռսվտրցւփքօֆՙ፩፪፫፬፭፮፯፰፱ሀሁሂሃሄህሆለሉሊላሌልሎሏሐሑሒሓሔሕሖሗመሙሚማሜምሞሟሠሡሢሣሤሥሦሧረሩሪራሬርሮሯሰሱሲሳሴስሶሷሸሹሺሻሼሽሾሿቀቁቂቃቄቅቆቈቊቋቌቍቐቑቒቓቔቕቖቘቚቛቜቝበቡቢባቤብቦቧቨቩቪቫቬቭቮቯተቱቲታቴትቶቷቸቹቺቻቼችቾቿኀኁኂኃኄኅኆኈኊኋኌኍነኑኒናኔንኖኗኘኙኚኛኜኝኞኟአኡኢኣኤእኦኧከኩኪካኬክኮኰኲኳኴኵኸኹኺኻኼኽኾዀዂዃዄዅወዉዊዋዌውዎዐዑዒዓዔዕዖዘዙዚዛዜዝዞዟዠዡዢዣዤዥዦዧየዩዪያዬይዮደዱዲዳዴድዶዷዸዹዺዻዼዽዾዿጀጁጂጃጄጅጆጇገጉጊጋጌግጎጐጒጓጔጕጘጙጚጛጜጝጞጠጡጢጣጤጥጦጧጨጩጪጫጬጭጮጯጰጱጲጳጴጵጶጷጸጹጺጻጼጽጾጿፀፁፂፃፄፅፆፈፉፊፋፌፍፎፏፐፑፒፓፔፕፖፗፘፙፚᎠᎡᎢᎣᎤᎥᎦᎧᎨᎩᎪᎫᎬᎭᎮᎯᎰᎱᎲᎳᎴᎵᎶᎷᎸᎹᎺᎻᎼᎽᎾᎿᏀᏁᏂᏃᏄᏅᏆᏇᏈᏉᏊᏋᏌᏍᏎᏏᏐᏑᏒᏓᏔᏕᏖᏗᏘᏙᏚᏛᏜᏝᏞᏟᏠᏡᏢᏣᏤᏥᏦᏧᏨᏩᏪᏫᏬᏭᏮᏯᏰᏱᏲᏳᏴ𐌀𐌁𐌂𐌃𐌄𐌅𐌆𐌇𐌈𐌉𐌊𐌋𐌌𐌍𐌎𐌏𐌐𐌑𐌒𐌓𐌔𐌕𐌖𐌗𐌘𐌙𐌚𐌛𐌜𐌝𐌞𐌰𐌱𐌲𐌳𐌴𐌵𐌶𐌷𐌸𐌹𐌺𐌻𐌼𐌽𐌾𐌿𐍀𐍁𐍂𐍃𐍄𐍅𐍆𐍇𐍈𐍉𐍊";
function idn(x) {
  if (x < base.length) return base[x];
  x -= base.length;
  if (x <= 0x2BA3) return String.fromCodePoint(0xAC00 + x); // Hangul Syllable
  x -= 0x2BA4;
  if (x <= 0x19B5) return String.fromCodePoint(0x3400 + x); // CJK Extension A
  x -= 0x19B6;
  if (x <= 0x5145) return String.fromCodePoint(0x4E00 + x); // CJK Ideograph
  x -= 0x5146;
  if (x <= 0x048C) return String.fromCodePoint(0xA000 + x); // Yi Letters
  x -= 0x048D;
  if (x <= 0xA6D6) return String.fromCodePoint(0x20000 + x); // CJK Extension B+
  throw Error('x is over 0xFFFF; WTF?');
}
function deidn(x, y) {
  let c = x.charCodeAt(0);
  let isSurrogate = (0xD800 <= c && c <= 0xDFFF);
  if (isSurrogate) c = 0x10000 + ((x.charCodeAt(0) - 0xD800) * 0x400) + (y.charCodeAt(0) - 0xDC00);
  let ret = base.length;
  if (0xAC00 <= c && c <= 0xD7A3) return [ret + c - 0xAC00, isSurrogate];
  ret += 0x2BA4;
  if (0x3400 <= c && c <= 0x4DB5) return [ret + c - 0x3400, isSurrogate];
  ret += 0x19B6;
  if (0x4E00 <= c && c <= 0x9F45) return [ret + c - 0x4E00, isSurrogate];
  ret += 0x5146;
  if (0xA000 <= c && c <= 0xA48C) return [ret + c - 0xA000, isSurrogate];
  ret += 0x048D;
  if (0x20000 <= c && c <= 0x2A6D6) return [ret + c - 0x20000, isSurrogate];
  return [base.indexOf(x), isSurrogate];
}

window.exportSequence = function(rawList, useIDN=false) {
  let list = [...rawList];
  let veri = list[0].indexOf('_');
  let version = list[0].slice(0, veri);
  list = list.map(x => deserializePuzzlePre(x.slice(veri + 1)));
  let len = list.map(x => x.length);
  let ret = (useIDN ? 'vs2i_' : 'vs2_') + version + '_';
  let res = "";
  res += String.fromCharCode((len.length & 0xFF00) >> 8) + String.fromCharCode(len.length & 0xFF);
  for (let k of len) { res += String.fromCharCode((k & 0xFF00) >> 8) + String.fromCharCode(k & 0xFF); }
  for (let i = 0; i < Math.max(...len); i++)
    for (let o of list) if (o[i] !== undefined) res += o[i];
  if (useIDN) {
    for (let i = 0; i < res.length; i += 2) {
      ret += idn((isNaN(res.charCodeAt(i)) ? 0 : res.charCodeAt(i) << 8) + (isNaN(res.charCodeAt(i+1)) ? 0 : res.charCodeAt(i+1)));
    }
    ret = runLengthV2(ret);
  }
  else {
    ret += runLengthV2(btoa(res).replace(/\+/g, '.').replace(/\//g, '-').replace(/\=/g, '_'));
  }
  return ret;
}

window.importSequence = function(string) {
  let veri = string.indexOf('_');
  let version = string.slice(0, veri);
  string = string.slice(veri + 1);
  if (version == 'vs1') return importSequenceV1(string);
  else if (version == 'vs2') return importSequenceV2(string);
  else if (version == 'vs2i') return importSequenceV2I(string);
  else throw Error('unknown puzzle format');
}

function importSequenceV1(string) {
  let res = string.split('~~');
  return res;
}

function importSequenceV2I(string) {
  let veri = string.indexOf('_');
  let version = string.slice(0, veri);
  let str = derunLengthV2(string.slice(veri + 1));
  string = "";
  for (let i = 0; i < str.length; i++) {
    let temp = deidn(str[i], str[i+1]);
    if (temp[1]) i++;
    string += String.fromCharCode((temp[0] & 0xFF00) >> 8) + String.fromCharCode(temp[0] & 0xFF);
  }
  return importSequenceV2Core(version, string);
}

function importSequenceV2(string) {
  let veri = string.indexOf('_');
  let version = string.slice(0, veri);
  string = atob(derunLengthV2(string.slice(veri + 1)).replace(/\./g, '+').replace(/\-/g, '/').replace(/\_/g, '='));
  return importSequenceV2Core(version, string);
}

function importSequenceV2Core(version, string) {
  let ret = [];
  let res = [];
  let ptr = 0;
  let puzzleLen = (string.charCodeAt(ptr) << 8) + string.charCodeAt(ptr + 1);
  ptr += 2;
  let lens = [];
  for (let i = 0; i < puzzleLen; i++) {
    ret.push(version + '_')
    res.push('');
    lens.push((string.charCodeAt(ptr) << 8) + string.charCodeAt(ptr + 1));
    ptr += 2;
  }
  for (let i = 0; i < Math.max(...lens); i++) {
    for (let j = 0; j < puzzleLen; j++) {
      if (i < lens[j]) {
        res[j] += string[ptr];
        ptr++;
      }
    }
  }
  for (let i = 0; i < puzzleLen; i++) ret[i] += runLength(btoa(res[i]).replace(/\+/g, '.').replace(/\//g, '-').replace(/\=/g, '_'));
  return ret;
}

})
