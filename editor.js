namespace(function() {

let activeParams = {'id':'', 'color':0, 'polyshape':71}
window.puzzle = null
let dragging = null

// write a singular puzzle for reload purposes
function writePuzzle() {
  console.log('Writing puzzle', puzzle)
  localStorage.puzzle = serializePuzzle(puzzle);
}

// Delete the active puzzle then read the next one.
window.deletePuzzle = function() {
  // since publish is gone, this is a reset button
  if (!puzzle?.width) createEmptyPuzzle(4, 4);
  else createEmptyPuzzle(Math.floor(puzzle.width / 2), Math.floor(puzzle.height / 2))
}

// Clear animations from the puzzle, redraw it, and add editor hooks.
// Note that this function DOES NOT reload the style, check for the automatic solver,
// reset the publish button, and other such 'meta' cleanup steps.
// You should only call this function if you're *sure* you're not in manual solve mode.
// If there's a chance that you are in manual solve mode, call reloadPuzzle().
function drawPuzzle() {
  window.draw(puzzle)
  window.clearAnimations()

  // @Robustness: Maybe I should be cleaning house more thoroughly? A class or something would let me just remove these...
  let puzzleElement = document.getElementById('puzzle')
  // Remove all 'onTraceStart' calls, they should be interacted through solveManually only.
  for (let child of puzzleElement.children) {
    child.onpointerdown = null
  }

  let addOnClick = function(elem, x, y) {
    elem.onpointerdown = function(event) {onElementClicked(event, x, y)}
  }

  let xPos = 40
  let topLeft = {'x':40, 'y':40}
  for (let x=0; x<puzzle.width; x++) {
    let yPos = 40
    let width = (x%2 === 0 ? 24 : 58)
    for (let y=0; y<puzzle.height; y++) {
      let height = (y%2 === 0 ? 24 : 58)
      let rect = createElement('rect')
      puzzleElement.appendChild(rect)
      rect.setAttribute('x', xPos)
      rect.setAttribute('y', yPos)
      rect.setAttribute('width', width)
      rect.setAttribute('height', height)
      rect.setAttribute('fill', 'white')
      rect.setAttribute('opacity', 0)
      yPos += height
      addOnClick(rect, x, y)
      rect.onpointerenter = function() {this.setAttribute('opacity', 0.25)}
      rect.onpointerleave = function() {this.setAttribute('opacity', 0)}
    }
    xPos += width
  }
}

const puzzleCheckbox = ['makePerfect', 'disableFlash', 'makeOptional', 'pillarX', 'pillarY', 'symmetryXY'];

function reloadPuzzle() {
  // Disable the Solve (manually) button, clear lines, and redraw the puzzle
  document.getElementById('solveMode').checked = true;
  document.getElementById('solveMode').onpointerdown();
  document.getElementById('solutionViewer').style.display = 'none';

  let save = document.getElementById('save');
  save.innerText = 'Get URL';
  save.onpointerdown = exportPuzzle;
  if (puzzle.grid.filter(x => x.filter(y => y?.type == 'vtriangle').length).length) document.getElementById('show-if-tent').style.display = 'flex';
  else {
    document.getElementById('show-if-tent').style.display = 'none';
    puzzle.sols = Math.max(puzzle.sols, 1);
  }
  document.getElementById('makePerfect').checked = (puzzle.sols == 0);
  document.getElementById('sols').value = puzzle.sols;
  if (puzzle.sols == 0) document.getElementById('set-sols').style.display = 'none';
  else document.getElementById('set-sols').style.display = 'unset';
  document.getElementById('pillarX').checked = puzzle.pillar[0];
  document.getElementById('pillarY').checked = puzzle.pillar[1];
  document.getElementById('symmetryX').value = puzzle.symmetry[0];
  document.getElementById('symmetryY').value = puzzle.symmetry[1];
  document.getElementById('symmetryXY').checked = puzzle.symmetry[2];
  document.getElementById('trX').value = puzzle.transform.translate[0];
  document.getElementById('trY').value = puzzle.transform.translate[1];
  document.getElementById('rtX').value = puzzle.transform.rotate[0];
  document.getElementById('rtY').value = puzzle.transform.rotate[1];
  document.getElementById('perspective').value = puzzle.transform.perspective;
  document.getElementById('scX').value = puzzle.transform.scale[0];
  document.getElementById('scY').value = puzzle.transform.scale[1];
  document.getElementById('skX').value = puzzle.transform.skew[0];
  document.getElementById('skY').value = puzzle.transform.skew[1];
  document.getElementById('epA').value = puzzle.endDest[0];
  document.getElementById('epB').value = puzzle.endDest[1];
  document.getElementById('epC').value = puzzle.endDest[2];
  document.getElementById('disableFlash').checked = puzzle.disableFlash;
  document.getElementById('makeOptional').checked = puzzle.optional;
  for (let o of puzzleCheckbox.map(x => document.getElementById(x))) o.style.background = o.checked ? 'var(--text)' : 'var(--background)';
  //* sound ui
  let sounds = puzzle.grid.flat().filter(x => x?.dot >= 40).map(x => x.dot - 39).sort((a, b) => a - b);
  temp = [...puzzle.soundDots];
  if (sounds != temp.sort((a, b) => a - b)) {
    temp = [...puzzle.soundDots];
    for (let o of puzzle.soundDots) {
      if (sounds.includes(o)) sounds.splice(sounds.indexOf(o), 1);
      else temp.splice(temp.indexOf(o), 1);
    }
    puzzle.soundDots = temp;
    for (let o of sounds) puzzle.soundDots.push(o);
  }
  updateSoundDotsList();
  console.log('Puzzle style:', puzzleStyle.value);
}

let dragged;
document.addEventListener("dragstart", (event) => { dragged = event.target; if ( event.target?.classList?.contains("dropzone")) event.target.style.opacity = .5; }, false);
document.addEventListener("dragend", (event) => { if ( event.target?.classList?.contains("dropzone")) event.target.style.opacity = ""; }, false);
document.addEventListener("dragenter", (event) => { if ( event.target?.classList?.contains("dropzone")) event.target.style.background = "var(--line-default)"; }, false);
document.addEventListener("dragleave", (event) => { if ( event.target?.classList?.contains("dropzone")) event.target.style.background = ""; }, false);
document.addEventListener("dragover", (event) => blockThis(event));
document.addEventListener("drop", (event) => { doDrop(event); }, false);

function updateSoundDotsList() {
  if (puzzle.soundDots.length) document.getElementById('hide-if-sound-dots').style.display = 'flex';
  else document.getElementById('hide-if-sound-dots').style.display = 'none';
  for (let o of Array.from(document.getElementById('sound-dots').childNodes)) o.parentElement.removeChild(o);
  for (let k in puzzle.soundDots) {
    let el = document.createElement('div');
    el.classList.add('dropzone', 'noselect');
    el.setAttribute('draggable', true);
    el.setAttribute('ondragstart', `event.dataTransfer.setData('text/plain', null)`)
    el.innerHTML = puzzle.soundDots[k];
    el.number = k;
    document.getElementById('sound-dots').appendChild(el);
  }
}

window.blockThis = (event) => {
  event.preventDefault(); 
  event.stopPropagation();
}

function doDrop(event) {
  let source = dragged.number;
  let target = event.target.number;
  let temp = puzzle.soundDots.splice(source, 1)[0];
  puzzle.soundDots.splice(target, 0, temp);
  updateSoundDotsList();
  reloadPuzzle();
  writePuzzle();
}

//** Buttons which the user can click on
window.createEmptyPuzzle = function(x = 4, y = x) {
  const qmin = [0, 1, 2, 1, 2, 2];
  x = Math.max(x, qmin[(3 * !!document.getElementById('pillarX').checked) + Number(document.getElementById('symmetryX').value)]);
  y = Math.max(y, qmin[(3 * !!document.getElementById('pillarY').checked) + Number(document.getElementById('symmetryY').value)]);
  if (document.getElementById('symmetryXY').checked) { x = Math.max(x, y); y = x; }
  let newPuzzle = new Puzzle(x, y, [!!document.getElementById('pillarX').checked, !!document.getElementById('pillarY').checked]);
  newPuzzle.sols = document.getElementById('makePerfect').checked ? 1 : Number(document.getElementById('sols').value);
  document.getElementById('makePerfect').checked = false;
  newPuzzle.symmetry = [Number(document.getElementById('symmetryX').value), Number(document.getElementById('symmetryY').value), !!document.getElementById('symmetryXY').checked];
  newPuzzle.transform = {
    'translate': [Number(document.getElementById('trX').value), Number(document.getElementById('trY').value)],
    'rotate': [Number(document.getElementById('rtX').value), Number(document.getElementById('rtY').value)],
    'perspective': Number(document.getElementById('perspective').value),
    'scale': [Number(document.getElementById('scX').value), Number(document.getElementById('scY').value)],
    'skew' : [Number(document.getElementById('skX').value), Number(document.getElementById('skY').value)]
  }
  for (let o of ['epA', 'epB', 'epC']) document.getElementById(o).value = 0;
  newPuzzle.disableFlash = !!document.getElementById('disableFlash').checked;
  newPuzzle.optional = !!document.getElementById('makeOptional').checked;
  let startPos = [0, mdiv(newPuzzle.height, 2)];
  if (newPuzzle.isSymmetry()) {
    let symPos = newPuzzle.getSymmetricalPos(...startPos);
    if (startPos == symPos) {
      startPos = [1, mdiv(newPuzzle.height, 2)];
      symPos = newPuzzle.getSymmetricalPos(...startPos);
    }
    newPuzzle.updateCell2(...symPos, 'start', true);
  }
  newPuzzle.updateCell2(...startPos, 'start', true);
  let endPos = [mdiv(newPuzzle.width, 2), 0];
  let endDir = newPuzzle.getValidEndDirs(...endPos);
  if (newPuzzle.isSymmetry()) {
    let symPos = newPuzzle.getSymmetricalPos(...endPos);
    let symDir = newPuzzle.getSymmetricalDir(endDir[0]);
    if (endPos == symPos) {
      endPos = [mdiv(newPuzzle.width, 2), 1];
      endDir = newPuzzle.getValidEndDirs(...endPos);
      symPos = newPuzzle.getSymmetricalPos(...endPos);
    }
    newPuzzle.updateCell2(...symPos, 'end', symDir);
  }
  newPuzzle.updateCell2(...endPos, 'end', endDir[0]);
  copyTheme(newPuzzle);
  copyImage(newPuzzle);
  document.getElementById('deleteButton').disabled = true
  window.puzzle = newPuzzle
  writePuzzle()
  reloadPuzzle()
}

window.setSolveMode = function(value) {
  document.getElementById('solveMode').checked = value
  if (value === true) {
    window.TRACE_COMPLETION_FUNC = function(solution, path) {
      puzzle = solution
      puzzle.path = path
      document.getElementById('save').disabled = false
    }
    // Redraw the puzzle, without interaction points. This is a bit of a @Hack, but it works.
    window.draw(puzzle)
  } else {
    puzzle.clearLines()
    window.TRACE_COMPLETION_FUNC = null
    drawPuzzle()
  }
}

window.changeSols = function(value) {
  puzzle.sols = document.getElementById('sols').value;
  reloadPuzzle();
  writePuzzle();
}

window.makePerfect = function(value) {
  document.getElementById('makePerfect').checked = value
  if (value) puzzle.sols = 0;
  else puzzle.sols = 1;
  reloadPuzzle();
  writePuzzle();
}

window.disableFlash = function(value) {
  document.getElementById('disableFlash').checked = value
  puzzle.disableFlash = value;
  reloadPuzzle();
  writePuzzle();
}

window.makeOptional = function(value) {
  document.getElementById('makeOptional').checked = value
  puzzle.optional = value;
  reloadPuzzle();
  writePuzzle();
}

//** End of user interaction points

window.reloadSymbolTheme = function() {
  drawSymbolButtons()
  reloadPuzzle()
}

window.onload = function() {
  let toLoad = (new URL(window.location.href).hash);
  drawSymbolButtons()
  drawColorButtons()
  if (toLoad) {
    deserializePuzzle(toLoad.slice(1));
    applyThemeButton();
    applyImageButton();
    reloadPuzzle();
    writePuzzle();
    document.getElementById('deleteButton').disabled = true
  } else if (localStorage.puzzle !== undefined) {
    window.puzzle = deserializePuzzle(localStorage.puzzle);
    applyThemeButton();
    applyImageButton();
  }
  else createEmptyPuzzle()
  reloadPuzzle()

  for (let resize of document.getElementsByClassName('resize')) {
    resize.onpointerdown = function(event) {
      if (event.touches > 1) return // Don't attempt to drag during screen resize
      dragStart(event, this)
    }
    if (resize.id == 'resize-left' || resize.id == 'resize-right') {
      let svg = drawSymbol({'type': 'drag', 'rot':1, 'width':6, 'height':22})
      svg.style.width = '6px'
      svg.style.height = '22px'
      resize.appendChild(svg)

      resize.style.display = 'flex'
      svg.style.margin = 'auto'
    } else if (resize.id == 'resize-top' || resize.id == 'resize-bottom') {
      let svg = drawSymbol({'type': 'drag', 'rot':0, 'width':22, 'height':6})
      svg.style.width = '22px'
      svg.style.height = '6px'
      resize.appendChild(svg)

      resize.style.display = 'flex'
      svg.style.margin = 'auto'
    }
  }
}

window.onSolvedPuzzle = function(paths) {
  // Only enable the save button if there was a valid path.
  if (paths.length > 0) {
    document.getElementById('save').disabled = false
  }
  return paths
}

let symbolData = {
  'start': {'type':'start', 'title':'Start point'},
  'end': {'type':'end', 'endType': 0, 'y': 18, 'dir':'top', 'title':'End point'},
  'gap': {'type':'gap', 'title':'Line break'},
  'dot': {'type':'dot', 'sound': 0, 'title':'Dot'},
  'square': {'type':'square', 'title':'Square'},
  'star': {'type':'star', 'title':'Star'},
  'nega': {'type':'nega', 'title':'Negation'},
  'triangle': {'type':'triangle', 'count': 1, 'title':'Triangle'},
  'poly': {'type':'poly', 'title':'Polyomino'},
  'ylop': {'type':'ylop', 'title':'Negation polyomino'},
  'bridge': {'type':'bridge', 'title':'Seren\'s Incomplete Pentagon'},
  'arrow': {'type':'arrow', 'count': 1, 'rot': 0, 'title':'Sigma\'s Arrow'},
  'sizer': {'type':'sizer', 'title':'Radiazia\'s Sizer'},
  'cross': {'type':'cross', 'title':'Cross'},
  'curve': {'type':'curve', 'title':'Diamond'},
  'crossFilled': {'type':'crossFilled', 'title':'Filled Cross'},
  'curveFilled': {'type':'curveFilled', 'title':'Filled Diamond'},
  'twobytwo': {'type':'twobytwo', 'title':'Two-By-Two'},
  'dart': {'type':'dart', 'count': 1, 'rot': 0, 'title':'Dart'},
  'polynt': {'type':'polynt', 'title':'unsuspiciousperson\'s Antipolyomino'}, 
  'divdiamond': {'type':'divdiamond', 'count':1, 'title':'ItzShaun\'s Divided Diamond'}, 
  'vtriangle': {'type':'vtriangle', 'title':'sus\' Tents'},
  'x-lu': {'type':'x', 'spokes': 16, 'title':'ItzShaun\' Xs'},
  'x-ru': {'type':'x', 'spokes': 16, 'title':'ItzShaun\' Xs'},
  'x-ld': {'type':'x', 'spokes': 16, 'title':'ItzShaun\' Xs'},
  'x-rd': {'type':'x', 'spokes': 16, 'title':'ItzShaun\' Xs'},
  'pentagon': {'type':'pentagon', 'title':'ItzShaun\'s Pentagons'},
  'copier': {'type':'copier', 'title':'Gentova\' Copiers'},
  'celledhex': {'type':'celledhex', 'title':'ItzShaun\'s Celled Hexes'},
  'scaler': {'type':'scaler', 'flip': 0, 'title':'Scalers (Revised Artless\' Carrots)'},
  'portal': {'type':'portal', 'title':'MarioMak\'s Portals'},
  'blackhole': {'type':'blackhole', 'title':'Pruz\'s Black Holes (Klyzx\'s Revision)'},
  'atriangle': {'type':'atriangle', 'count': 1, 'title':'Klyzx\'s Antitriangles'},
  'whitehole': {'type':'whitehole', 'title':'White Holes'},
  'pokerchip': {'type':'pokerchip', 'title':'MarioMak\'s Chips'},
  'dice': {'type':'dice', 'count': 1, 'title':'Niko\'s Dices'},
  'xvmino': {'type':'xvmino', 'title':'Pruz\'s \'Red Polyomino\' (Kate\'s Redesign)'},
  'crystal': {'type':'crystal', 'count': 1, 'title':'ianpep\'s Crystals'},
  'dots': {'type': 'dots', 'count': 1, 'title':'ianpep\'s Little Squares'},
  'swirl': {'type': 'swirl', 'flip': false, 'title':'Alith\'s Swirls'},
  'eye': {'type': 'eye', 'count': 1, 'title':'AnActualCat\'s Eyes'},
  'line': {'type': 'line', 'title': 'Predrawn Line'},
  'squareToPentagon': {'type':'square', 'title':'Square'},
  'whiteAndBlackHole': {'type':'blackhole', 'title':'Pruz\'s Black Holes (Klyzx\'s Revision)'},
  'CrossCurve': {'type':'cross', 'title':'Cross'},
  'none': {'type': 'none', 'title': 'Symbol Coming Soon!'}
}
let xButtons = [];

function buttonBehaviour(event, el, onClickAgain) {
  reloadPuzzle() // Disable manual solve mode to allow puzzle editing
  if (!event.shiftKey && activeParams.id === el.id) (onClickAgain)(el);
  delete el.params.color;
  activeParams = Object.assign(activeParams, el.params)
  drawSymbolButtons()
  if (event.shiftKey) {
    let avail = (y, x) => { return (y % 2 == 1) && (x % 2 == 1); }
    if (['dot', 'cross', 'curve', 'dots', 'soundDot', 'x'].includes(el.params.type))
      avail = (y, x) => { return (y % 2 == 0) && (x % 2 == 0); }
    else if (['gap', 'line'].includes(el.params.type))
      avail = (y, x) => { return (y % 2) != (x % 2); }
    else if (['start', 'end'].includes(el.params.type))
      avail = (y, x) => { return (y % 2 != 1) || (x % 2 != 1); }
    for (let i = 0; i < puzzle.height; i++) for (let j = 0; j < puzzle.width; j++) 
      if (avail(i, j)) {
        onElementClicked(event, j, i, false);
        puzzleModified()
        writePuzzle()
        reloadPuzzle()
      }
  }
}

function drawSymbolButtons() {
  let symbolTable = document.getElementById('symbolButtons')
  symbolTable.style.display = null;
  for (let button of symbolTable.getElementsByTagName('button')) {
    if (['more', 'less'].includes(button.id)) continue;
    let params = symbolData[button.id]
    params.id = button.id
    params.height = params.type == 'x' ? 30 : 58
    params.width = params.type == 'x' ? 30 : 58
    params.border = params.type == 'x' ? 0 : 2
    if (params.type == 'x') xButtons.push(button.id)
    if (activeParams.id === button.id) {
      if (['x-lu', 'x-ru', 'x-ld', 'x-rd'].includes(button.id)) {
        if (document.getElementById('x-fakebutton')) document.getElementById('x-fakebutton').style.backgroundColor = window.symbolColors[activeParams.color];
        button.parentElement.style.backgroundColor = null;
      } else {
        if (document.getElementById('x-fakebutton')) document.getElementById('x-fakebutton').style.backgroundColor = null;
        button.parentElement.style.backgroundColor = window.symbolColors[activeParams.color];
      }
    } else button.parentElement.style.backgroundColor = null;
    button.style.padding = 0
    button.style.border = params.border
    button.style.height = params.height + 2*params.border
    button.style.width = params.width + 2*params.border
    button.title = params.title
    button.params = params
    button.params.color = (params.type == 'x') ? '#F66' : 'var(--text)'
    button.style.display = null

    let cycle;
    switch (button.id) {
      case 'poly':
      case 'ylop':
      case 'polynt':
      case 'xvmino':
        button.params.polyshape = activeParams.polyshape
        button.onpointerdown = function(event) { buttonBehaviour(event, this, (el) => { shapeChooser(); })}
        break;
      case 'end':
        button.onpointerdown = function(event) { buttonBehaviour(event, this, (el) => {
          let endType = symbolData[activeParams.id].endType
          if (endType == undefined) endType = 0
          endType = (endType + (event.isRightClick() ? 2 : 1)) % 3;
          symbolData[activeParams.id].endType = endType
          activeParams.endType = endType
        })}
        break;
      case 'divdiamond':
      case 'dice':
        cycle ??= 9;
      case 'crystal':
        cycle ??= 5
      case 'triangle':
      case 'atriangle':
      case 'dots':
      case 'eye':
        cycle ??= 4;
        button.onpointerdown = function(event) { buttonBehaviour(event, this, (el) => {
          let count = symbolData[activeParams.id].count
          count += (event.isRightClick() ? -1 : 1)
          if (count <= 0) count = cycle
          if (count > cycle) count = 1
          symbolData[activeParams.id].count = count
          activeParams.count = count
        })}
        break;
      case 'arrow':
      case 'dart':
        button.onpointerdown = function(event) { buttonBehaviour(event, this, (el) => {
          let rot = symbolData[activeParams.id].rot
          if (rot == undefined) rot = 0
          rot = (rot + (event.isRightClick() ? 7 : 1)) % 8;
          symbolData[activeParams.id].rot = rot
          activeParams.rot = rot
        })}
        break;
      case 'scaler':
      case 'swirl':
        button.onpointerdown = function(event) { buttonBehaviour(event, this, (el) => {
          let flip = symbolData[activeParams.id].flip
          flip = !flip;
          symbolData[activeParams.id].flip = flip
          activeParams.flip = flip
        })}
        break;
      case 'x-lu':
      case 'x-ru':
      case 'x-ld':
      case 'x-rd':
      case 'x':
        button.onpointerdown = function(event) { 
          const corners = { 'x-lu': 1, 'x-ru': 2, 'x-ld': 4, 'x-rd': 8 };
          reloadPuzzle() // Disable manual solve mode to allow puzzle editing
          if (!event.shiftKey && activeParams.id === this.id) for (xbutton of xButtons) {
            if (event.isRightClick())
              symbolData[xbutton].spokes = ((symbolData[xbutton].spokes - 1) & ~corners[this.id]) + 1;
            else
              symbolData[xbutton].spokes = ((symbolData[xbutton].spokes - 1) ^ corners[this.id]) + 1;
          }
          delete this.params.color;
          activeParams = Object.assign(activeParams, this.params)
          drawSymbolButtons()
          if (event.shiftKey) 
            for (let i = 0; i < puzzle.height; i++) for (let j = 0; j < puzzle.width; j++) 
              if (!((i + j) % 2)) {
                onElementClicked(event, j, i, false);
                puzzleModified()
                writePuzzle()
                reloadPuzzle()
              }
        }
        break;
      case 'dot':
        button.onpointerdown = function(event) { buttonBehaviour(event, this, (el) => {
          symbolData[activeParams.id].sound ^= 1
        }); }
        break;
      case 'squareToPentagon':
        button.onpointerdown = function(event) { buttonBehaviour(event, this, (el) => {
          if (symbolData[activeParams.id].type == 'square') symbolData[activeParams.id] = {...symbolData['pentagon']};
          else symbolData[activeParams.id] = {...symbolData['square']};
          el.params.type = symbolData[activeParams.id].type;
        }); }
        break;
      case 'whiteAndBlackHole':
        button.onpointerdown = function(event) { buttonBehaviour(event, this, (el) => {
          if (symbolData[activeParams.id].type == 'blackhole') symbolData[activeParams.id] = {...symbolData['whitehole']};
          else symbolData[activeParams.id] = {...symbolData['blackhole']};
          el.params.type = symbolData[activeParams.id].type;
        }); }
        break;
      case 'CrossCurve':
        button.onpointerdown = function(event) { buttonBehaviour(event, this, (el) => {
          if (symbolData[activeParams.id].type == 'cross') symbolData[activeParams.id] = {...symbolData['curve']};
          else symbolData[activeParams.id] = {...symbolData['cross']};
          el.params.type = symbolData[activeParams.id].type;
        }); }
        break;
      default:
        button.onpointerdown = function(event) { buttonBehaviour(event, this, (el) => {}); }
        break;
    }
    button.oncontextmenu = (event) => { event.preventDefault(); }

    while (button.firstChild) button.removeChild(button.firstChild)
    let svg = window.drawSymbol(params)
    if (button.id == 'x-lu') {
      let fakebutton = document.getElementById('x-fakesvg')
      while (fakebutton.firstChild) fakebutton.removeChild(fakebutton.firstChild)
      fakebutton.appendChild(svg)
      svg.setAttribute('viewBox', '-15 -15 60 60')
      svg.setAttribute('width', '60px')
    }
    else if (button.id == 'x-ru' || button.id == 'x-ld' || button.id == 'x-rd') svg.style.display = "none"
    else button.appendChild(svg)
    if (window.polyominoes.includes(button.id)) {
      let is4Wide = (activeParams.polyshape & 0x000F) && (activeParams.polyshape & 0xF000)
      let is4Tall = (activeParams.polyshape & 0x1111) && (activeParams.polyshape & 0x8888)
      if (is4Wide || is4Tall) {
        svg.setAttribute('viewBox', '-8 -8 80 80')
      }
    }
  }
}

window.seeMore = function() {
  document.querySelector(':root').style.setProperty('--more', 'table-cell');
  document.querySelector(':root').style.setProperty('--less', 'none');
}

window.seeLess = function() {
  document.querySelector(':root').style.setProperty('--more', 'none');
  document.querySelector(':root').style.setProperty('--less', 'table-cell');
}

function drawColorButtons() {
  let colorTable = document.getElementById('colorButtons')
  colorTable.style.display = null
  let changeActiveColor = function() {
    reloadPuzzle() // Disable manual solve mode to allow puzzle editing
    activeParams.color = symbolColors.indexOf(this.id);
    let symbolTable = document.getElementById('symbolButtons')
    for (let button of symbolTable.getElementsByTagName('button')) {
      if (activeParams.id === button.id) {
        if (['x-lu', 'x-ru', 'x-ld', 'x-rd'].includes(button.id)) {
          if (document.getElementById('x-fakebutton')) document.getElementById('x-fakebutton').style.backgroundColor = window.symbolColors[activeParams.color];
          button.parentElement.style.backgroundColor = null;
        } else {
          if (document.getElementById('x-fakebutton')) document.getElementById('x-fakebutton').style.backgroundColor = null;
          button.parentElement.style.backgroundColor = window.symbolColors[activeParams.color];
        }
      } else {
        button.parentElement.style.backgroundColor = null;
      }
    }
    drawColorButtons()
  }
  for (let button of colorTable.getElementsByTagName('button')) {
    let params = {
      'width': 45,
      'height': 45,
      'border': 2,
      'type': 'square',
      'text': button.id,
      'color': symbolColors.indexOf(button.id),
    }
    if (activeParams.color === button.id) {
      button.parentElement.style.background = 'var(--border)'
    } else {
      button.parentElement.style.background = null
    }
    button.style.padding = 0
    button.style.border = params.border
    button.style.height = params.height + 2*params.border
    button.style.width = params.width + 2*params.border
    button.onpointerdown = changeActiveColor
    while (button.firstChild) button.removeChild(button.firstChild)
    let crayon = window.drawSymbol(params)
    button.appendChild(crayon)
  }
}

function shapeChooser() {
  let puzzle = document.getElementById('puzzle')
  puzzle.style.opacity = 0

  let anchor = document.createElement('div')
  document.body.appendChild(anchor)
  anchor.id = 'anchor'
  anchor.onpointerdown = function(event) {shapeChooserClick(event)}

  let chooser = document.createElement('div')
  puzzle.parentElement.insertBefore(chooser, puzzle)
  chooser.id = 'chooser'
  chooser.onpointerdown = function(event) {shapeChooserClick(event)}

  let chooserTable = document.createElement('table')
  chooser.appendChild(chooserTable)
  chooserTable.id = 'chooser-table'
  chooserTable.onpointerdown = function(event) {shapeChooserClick(event, this)}

  for (let x=0; x<4; x++) {
    let row = chooserTable.insertRow(x)
    for (let y=0; y<4; y++) {
      let cell = row.insertCell(y)
      cell.classList.add('chooser-cell')
      cell.powerOfTwo = 1 << (x + y*4)
      cell.onpointerdown = function(event) {shapeChooserClick(event, this)}
      if ((activeParams.polyshape & cell.powerOfTwo) !== 0) {
        cell.clicked = true
        cell.style.background = 'var(--line-default)'
      } else {
        cell.clicked = false
        cell.style.background = 'var(--line-undone)'
      }
    }
  }

}

function shapeChooserClick(event, cell) {
  function polySort(shape) {
    let xBar = 0x1111;
    let yBar = 0x000F;
    if (!(shape & 0xFFFF)) return 1;
    while (!(shape & yBar)) shape >>= 4;
    while (!(shape & xBar)) shape >>= 1;
    return shape;
  }

  let chooser = document.getElementById('chooser')
  if (cell == null) { // Clicked outside the chooser, close the selection window
    let anchor = document.getElementById('anchor')
    let puzzle = document.getElementById('puzzle')

    activeParams.polyshape = polySort(activeParams.polyshape)
    drawSymbolButtons()
    chooser.parentElement.removeChild(chooser)
    anchor.parentElement.removeChild(anchor)
    puzzle.style.opacity = null
    puzzle.style.minWidth = null
    event.stopPropagation()
    return
  }

  // Clicks inside the green box are non-closing
  if (cell.id == 'chooser-table') {
    event.stopPropagation()
    return
  }
  cell.clicked = !cell.clicked
  activeParams.polyshape ^= cell.powerOfTwo
  if (cell.clicked) {
    cell.style.background = 'var(--line-default)'
  } else {
    cell.style.background = 'var(--line-undone)'
  }
  drawSymbolButtons()
}

// Returns the next value in the list.
// If the value is not found, defaults to the first element.
// If the value is found, but is the last value, returns null.
function getNextValue(list, value) {
  let index = list.indexOf(value)
  return list[index + 1] ?? undefined
}

// Called whenever a grid cell is clicked. Uses the global activeParams to know
// what combination of shape & color are currently selected.
// This function also ensures that the resulting puzzle is still sane, and will modify
// the puzzle to add symmetrical elements, remove newly invalidated elements, etc.
function onElementClicked(event, x, y, update=true) {
  if (event.isRightClick()) {
    // Clear the associated cell
    if (x%2 === 1 && y%2 === 1) {
      puzzle.grid[x][y] = null
    } else {
      puzzle.grid[x][y].end = undefined
      puzzle.grid[x][y].endType = undefined
      puzzle.grid[x][y].start = undefined
      puzzle.grid[x][y].dot = undefined
      puzzle.grid[x][y].gap = undefined
      if (puzzle.isSymmetry()) {
        let sym = puzzle.getSymmetricalPos(x, y)
        puzzle.updateCell2(...sym, 'start', null)
        puzzle.updateCell2(...sym, 'end', null)
      }
    }
  } else if (activeParams.type == 'start') {
    if (x%2 === 1 && y%2 === 1) return
    if (puzzle.grid[x][y].gap != undefined) return

    if (puzzle.grid[x][y].start !== true) {
      puzzle.grid[x][y].start = true
    } else {
      puzzle.grid[x][y].start = undefined
    }
    if (puzzle.isSymmetry()) {
      let sym = puzzle.getSymmetricalPos(x, y)
      if (sym == [x, y]) {
        // If the two startpoints would be in the same location, do nothing.
        puzzle.grid[x][y].start = undefined
      } else {
        puzzle.updateCell2(...sym, 'start', puzzle.grid[x][y].start)
      }
    }
  } else if (activeParams.type == 'end') {
    if (x%2 === 1 && y%2 === 1) return
    if (puzzle.grid[x][y].gap != undefined) return

    let validDirs = puzzle.getValidEndDirs(x, y)

    // If (x, y) is an endpoint, loop to the next direction
    // If the direction loops past the end (or there are no valid directions),
    // remove the endpoint by setting to null.
    let dir = (puzzle.grid[x][y].endType === activeParams.endType) ? getNextValue(validDirs, puzzle.grid[x][y].end) : validDirs[0];
    puzzle.grid[x][y].end = dir
    puzzle.grid[x][y].endType = activeParams.endType
    if (puzzle.isSymmetry()) {
      let sym = puzzle.getSymmetricalPos(x, y)
      if (sym == [x, y]) {
        // If the two endpoints would be in the same location, do nothing.
        puzzle.grid[x][y].end = undefined
        puzzle.grid[x][y].endType = undefined
      } else {
        let symmetricalDir = puzzle.getSymmetricalDir(dir)
        puzzle.updateCell2(...sym, 'end', symmetricalDir)
      }
    }
  } else if (activeParams.type == 'dot') {
    if (x%2 === 1 && y%2 === 1) return
    let dotColors;
    if (activeParams.sound) {
      dotColors = [undefined, 40, 41, 42, 43, 44, 45, 46];
    } else {
      dotColors = [undefined, 1]
      if (puzzle.isSymmetry()) {
        dotColors.push(2)
        dotColors.push(3)
      }
      dotColors.push(4)
    }
    puzzle.grid[x][y].dot = getNextValue(dotColors, puzzle.grid[x][y].dot)
    if (puzzle.grid[x][y].gap !== window.CUSTOM_LINE) puzzle.grid[x][y].gap = undefined
  } else if (activeParams.type == 'cross' || activeParams.type == 'curve') {
    let offset = 0;
    if (activeParams.type == 'curve') offset = -6;
    if (x%2 !== 0 || y%2 !== 0) return
    let dotColors = [undefined, -1 + offset, -2 + offset]
    if (puzzle.isSymmetry()) {
      dotColors.push(-3 + offset)
      dotColors.push(-4 + offset)
      dotColors.push(-5 + offset)
      dotColors.push(-6 + offset)
    }
    puzzle.grid[x][y].dot = getNextValue(dotColors, puzzle.grid[x][y].dot)
    if (puzzle.grid[x][y].gap !== window.CUSTOM_LINE) puzzle.grid[x][y].gap = undefined
  } else if (activeParams.type == 'x') {
    if (x%2 !== 0 || y%2 !== 0) return
    let spokes = activeParams.spokes - 1;
    let savedGrid = puzzle.switchToMaskedGrid() 
    if (!(puzzle.grid[x - 1] && puzzle.grid[x - 1][y - 1])) spokes &= ~1
    if (!(puzzle.grid[x + 1] && puzzle.grid[x + 1][y - 1])) spokes &= ~2
    if (!(puzzle.grid[x - 1] && puzzle.grid[x - 1][y + 1])) spokes &= ~4
    if (!(puzzle.grid[x + 1] && puzzle.grid[x + 1][y + 1])) spokes &= ~8
    puzzle.grid = savedGrid
    if (puzzle.grid[x][y].dot == -13 - spokes) delete puzzle.grid[x][y].dot
    else puzzle.grid[x][y].dot = -13 - spokes;
    if (puzzle.grid[x][y].gap !== window.CUSTOM_LINE) puzzle.grid[x][y].gap = undefined
  } else if (activeParams.type == 'dots') {
    if (x%2 === 1 && y%2 === 1) return
    let offset = 4 + (7 * activeParams.count);
    let dotColors = [undefined, 1 + offset, 2 + offset];
    if (puzzle.isSymmetry()) {
      dotColors.push(3 + offset);
      dotColors.push(4 + offset);
      dotColors.push(5 + offset);
      dotColors.push(6 + offset);
    }
    dotColors.push(7 + offset);
    puzzle.grid[x][y].dot = getNextValue(dotColors, puzzle.grid[x][y].dot);
    if (puzzle.grid[x][y].gap !== window.CUSTOM_LINE) puzzle.grid[x][y].gap = undefined
  } else if (['gap', 'line'].includes(activeParams.type)) {
    if (x%2 === y%2) return
    puzzle.grid[x][y].gap = getNextValue(activeParams.type == 'gap' ? [undefined, 1, 2] : [undefined, 3], puzzle.grid[x][y].gap)
    if (activeParams.type == 'line') {
      if (update) {
        puzzleModified()
        writePuzzle()
        reloadPuzzle()
      } 
      return;
    }
    puzzle.grid[x][y].dot = undefined
    puzzle.grid[x][y].start = undefined
    puzzle.grid[x][y].end = undefined
    // Ensure that a symmetrical start or end is no longer impossible
    if (puzzle.isSymmetry()) {
      let sym = puzzle.getSymmetricalPos(x, y)
      puzzle.grid[sym[0]][sym[1]].start = undefined
      puzzle.grid[sym[0]][sym[1]].end = undefined
    }

    // This potentially isolated a start/endpoint, so ensure that they are removed.
    for (let i=x-1; i<x+2; i++) {
      for (let j=y-1; j<y+2; j++) {
        if (i%2 !== 0 || j%2 !== 0) continue;
        let leftCell = puzzle.getCell(i - 1, j)
        if (leftCell != null && leftCell.gap !== 2) continue;
        let rightCell = puzzle.getCell(i + 1, j)
        if (rightCell != null && rightCell.gap !== 2) continue;
        let topCell = puzzle.getCell(i, j - 1)
        if (topCell != null && topCell.gap !== 2) continue;
        let bottomCell = puzzle.getCell(i, j + 1)
        if (bottomCell != null && bottomCell.gap !== 2) continue;

        // At this point, the cell has no defined or non-gap2 neighbors (isolated)
        puzzle.updateCell2(i, j, 'start', false)
        puzzle.updateCell2(i, j, 'end', null)
        if (puzzle.isSymmetry()) {
          let sym = puzzle.getSymmetricalPos(i, j)
          console.debug('Enforcing symmetrical startpoint at', sym)
          puzzle.updateCell2(...sym, 'start', false, 'end', null)
          puzzle.updateCell2(...sym, 'end', null)
        }
      }
    }
  } else if (['square', 'star', 'nega', 'bridge', 'sizer', 'twobytwo', 'vtriangle', 'pentagon', 'copier', 'celledhex', 'portal', 'blackhole', 'whitehole', 'pokerchip'].includes(activeParams.type)) {
    if (x%2 !== 1 || y%2 !== 1) return
    // Only remove the element if it's an exact match
    if (puzzle.grid[x][y] != null
     && puzzle.grid[x][y].type === activeParams.type
     && puzzle.grid[x][y].color === activeParams.color) {
      puzzle.grid[x][y] = null
    } else {
      puzzle.grid[x][y] = {
        'type': activeParams.type,
        'color': activeParams.color,
      }
    }
  } else if (['scaler', 'swirl'].includes(activeParams.type)) {
    if (x%2 !== 1 || y%2 !== 1) return
    if (puzzle.grid[x][y] != null
      && puzzle.grid[x][y].type === activeParams.type
      && puzzle.grid[x][y].color === activeParams.color) {
        if (puzzle.grid[x][y].flip == activeParams.flip) puzzle.grid[x][y].flip = (1 - activeParams.flip);
        else puzzle.grid[x][y] = null
     } else {
       puzzle.grid[x][y] = {
         'type': activeParams.type,
         'color': activeParams.color,
         'flip': activeParams.flip,
       }
     }
  } else if (window.polyominoes.includes(activeParams.type)) {
    if (x%2 !== 1 || y%2 !== 1) return
    // Only remove the element if it's an exact match
    console.log(puzzle.grid[x][y], activeParams)
    if (puzzle.grid[x][y] != null
      && puzzle.grid[x][y].type === activeParams.type
      && puzzle.grid[x][y].color === activeParams.color
      && puzzle.grid[x][y].polyshape === activeParams.polyshape)
      puzzle.grid[x][y].polyshape = activeParams.polyshape | window.ROTATION_BIT;
    else if (puzzle.grid[x][y] != null
      && puzzle.grid[x][y].type === activeParams.type
      && puzzle.grid[x][y].color === activeParams.color
      && puzzle.grid[x][y].polyshape === activeParams.polyshape | window.ROTATION_BIT)
        puzzle.grid[x][y] = null
    else
      puzzle.grid[x][y] = {
        'type': activeParams.type,
        'color': activeParams.color,
        'polyshape': activeParams.polyshape,
      }
  } else if (['triangle', 'atriangle', 'divdiamond', 'dice', 'crystal', 'eye'].includes(activeParams.type)) {
    let cycle;
    if (['divdiamond', 'dice'].includes(activeParams.type)) cycle = 9;
    else if (['crystal'].includes(activeParams.type)) cycle = 5;
    else cycle = 4;
    if (x%2 !== 1 || y%2 !== 1) return
    // Only increment count if exact match
    if (puzzle.grid[x][y] != null
     && puzzle.grid[x][y].type === activeParams.type
     && puzzle.grid[x][y].color === activeParams.color) {
      puzzle.grid[x][y].count = puzzle.grid[x][y].count % cycle + 1
      // Remove when it matches activeParams -- this allows fluid cycling
      if (puzzle.grid[x][y].count === activeParams.count) {
        puzzle.grid[x][y] = null
      }
    } else {
      puzzle.grid[x][y] = {
        'type': activeParams.type,
        'color': activeParams.color,
        'count': activeParams.count
      }
    }
  } else if (['arrow', 'dart'].includes(activeParams.type)) {
    if (x%2 !== 1 || y%2 !== 1) return
    if (puzzle.grid[x][y] != null
     && puzzle.grid[x][y].type === activeParams.type
     && puzzle.grid[x][y].color === activeParams.color
     && puzzle.grid[x][y].rot === activeParams.rot) {
      puzzle.grid[x][y].count++
      if (puzzle.grid[x][y].count >= 5) {
        puzzle.grid[x][y] = null
      }
    } else {
      puzzle.grid[x][y] = {
        'type': activeParams.type,
        'color': activeParams.color,
        'count': activeParams.count,
        'rot': activeParams.rot,
      }
    }
  } else {
    console.debug('OnElementClick called but no active parameter type recognized')
    return
  }

  // Ensure adjacent endpoints are still pointing in a valid direction.
  for (let i=x-1; i<x+2; i++) {
    for (let j=y-1; j<y+2; j++) {
      let cell = puzzle.getCell(i, j)
      if (!cell?.end) continue;
      let validDirs = puzzle.getValidEndDirs(i, j)
      if (!validDirs.includes(cell.end)) {
        puzzle.grid[i][j].end = validDirs[0]
        if (puzzle.isSymmetry()) {
          let sym = puzzle.getSymmetricalPos(i, j)
          puzzle.grid[sym[0]][sym[1]] = validDirs[0]
        }
      }
    }
  }

  if (update) {
    puzzleModified()
    writePuzzle()
    reloadPuzzle()
  }
}

//* end of nightmare

// All puzzle elements remain fixed, the edge you're dragging is where the new
// row/column is added. The endpoint will try to stay fixed, but may be re-oriented.
// In symmetry mode, we will preserve symmetry and try to guess how best to keep start
// and endpoints in sync with the original design.
function resizePuzzle(dx, dy, id) {
  let oldWidth = div(puzzle.width, 2);
  let oldHeight = div(puzzle.height, 2);
  let xOffset = 0, yOffset = 0;
  if (puzzle.pillar[0]) dx *= 2;
  if (puzzle.pillar[1]) dy *= 2;
  let newWidth = oldWidth + dx
  let newHeight = oldHeight + dy
  const qmin = [0, 1, 2, 1, 2, 2];
  newWidth = Math.max(newWidth, qmin[(3 * puzzle.pillar[0]) + puzzle.symmetry[0]]);
  newHeight = Math.max(newHeight, qmin[(3 * puzzle.pillar[1]) + puzzle.symmetry[1]]);
  if (puzzle.symmetry[2]) { newWidth = Math.max(newWidth, newHeight); newHeight = newWidth; }
  if (newWidth === puzzle.width && newHeight === puzzle.height) return false;
  const MAX_RES = 21;
  if (newWidth > MAX_RES || newHeight > MAX_RES) return false
  dx = newWidth - oldWidth; dy = newHeight - oldHeight;
  if (id.includes('left')) xOffset = dx;
  if (id.includes('top')) yOffset = dy;
  if (dx > 1) xOffset = dx / 2;
  if (dy > 1) yOffset = dy / 2;
  console.log('Resizing puzzle of size', oldWidth, oldHeight, 'to', newWidth, newHeight)
  xOffset *= 2; yOffset *= 2;
  // We don't call new Puzzle here so that we can persist extended puzzle attributes (pillar, symmetry, etc)
  let oldPuzzle = new Puzzle(JSON.parse(JSON.stringify(puzzle)));
  puzzle.newGrid(newWidth * 2 + !puzzle.pillar[0], newHeight * 2 + !puzzle.pillar[1])
  for (let x=0; x<Math.min(puzzle.width, oldPuzzle.width); x++) for (let y=0; y<Math.min(puzzle.height, oldPuzzle.height); y++) {
    if (!puzzle.grid[x + xOffset]?.[y + yOffset]) continue;
    puzzle.grid[x + xOffset][y + yOffset] = oldPuzzle.grid[x][y];
    if (puzzle.grid[x + xOffset][y + yOffset]) {
      puzzle.grid[x + xOffset][y + yOffset].start = undefined;
      puzzle.grid[x + xOffset][y + yOffset].end = undefined;
      puzzle.grid[x + xOffset][y + yOffset].endType = undefined;
    }
  }
  let startPos = [0, mdiv(puzzle.height, 2)];
  if (puzzle.isSymmetry()) {
    let symPos = puzzle.getSymmetricalPos(...startPos);
    if (startPos == symPos) {
      startPos = [1, mdiv(puzzle.height, 2)];
      symPos = puzzle.getSymmetricalPos(...startPos);
    }
    puzzle.updateCell2(...symPos, 'start', true);
  }
  puzzle.updateCell2(...startPos, 'start', true);
  let endPos = [mdiv(puzzle.width, 2), 0];
  let endDir = puzzle.getValidEndDirs(...endPos);
  if (puzzle.isSymmetry()) {
    let symPos = puzzle.getSymmetricalPos(...endPos);
    let symDir = puzzle.getSymmetricalDir(endDir[0]);
    if (endPos == symPos) {
      endPos = [mdiv(puzzle.width, 2), 1];
      endDir = puzzle.getValidEndDirs(...endPos);
      symPos = puzzle.getSymmetricalPos(...endPos);
    }
    puzzle.updateCell2(...symPos, 'end', symDir);
  }
  puzzle.updateCell2(...endPos, 'end', endDir[0]);
  return true
}

let passive = false
try {
  window.addEventListener('test', null, Object.defineProperty({}, 'passive', {
    get: function() {
      passive = {passive: false}
    }
  }))
} catch {/* empty */}

document.addEventListener('touchmove', function(event) {
  if (dragging) event.preventDefault()
}, passive)

function dragStart(event, elem) {
  dragging = {
    'x': event.pageX || event.clientX || event.touches[0].pageX,
    'y': event.pageY || event.clientY || event.touches[0].pageY,
  }

  let anchor = document.createElement('div')
  document.body.appendChild(anchor)

  anchor.id = 'anchor'
  anchor.style.position = 'absolute'
  anchor.style.top = 0
  anchor.style.width = '99%'
  anchor.style.height = '100%'
  anchor.style.cursor = elem.style.cursor
  document.onmousemove = function(event) {dragMove(event, elem)}
  document.ontouchmove = function(event) {dragMove(event, elem)}
  document.ontouchend = function(event) {dragEnd(event, elem)}
}

function dragEnd(event, elem) {
  console.log('Drag ended')
  dragging = null
  let anchor = document.getElementById('anchor')
  anchor.parentElement.removeChild(anchor)
  document.onmousemove = null
  document.ontouchmove = null
  document.ontouchend = null
}

function dragMove(event, elem) {
  let newDragging = {
    'x': event.pageX || event.clientX || event.touches[0].pageX,
    'y': event.pageY || event.clientY || event.touches[0].pageY,
  }
  console.spam(newDragging.x, newDragging.y)
  if (event.buttons === 0) return dragEnd(event, elem)
  if (dragging == null) return
  let dx = 0
  let dy = 0
  if (elem.id.includes('left')) {
    dx = dragging.x - newDragging.x
  } else if (elem.id.includes('right')) {
    dx = newDragging.x - dragging.x
  }
  if (elem.id.includes('top')) {
    dy = dragging.y - newDragging.y
  } else if (elem.id.includes('bottom')) {
    dy = newDragging.y - dragging.y
  }

  console.spam(dx, dy)

  let xLim = 40
  let yLim = 40
  // 4x4 and larger will only expand downwards, so we have to require more motion.
  if (puzzle.height >= 9) {
    yLim = 60
  }

  // Note: We only modify dragging when we reach a limit.
  // Note: We use Math.sign (rather than Math.round or Math.floor) since we only want to resize 1 unit at a time.

  while (Math.abs(dx) >= xLim) {
    if (!resizePuzzle(Math.sign(dx), 0, elem.id)) break;
    puzzleModified()
    writePuzzle()
    reloadPuzzle()
    dx -= Math.sign(dx) * xLim
    dragging.x = newDragging.x
  }

  while (Math.abs(dy) >= yLim) {
    if (!resizePuzzle(0, Math.sign(dy), elem.id)) break;
    puzzleModified()
    writePuzzle()
    reloadPuzzle()
    dy -= Math.sign(dy) * yLim
    dragging.y = newDragging.y
  }
}

function puzzleModified() {
  document.getElementById('deleteButton').disabled = false
}

window.changeColor = function (id, value) {
  if ((id.indexOf('line') + 1) && value == getComputedStyle(document.documentElement).getPropertyValue('--line-undone')) value += '00';
  document.documentElement.style.setProperty('--' + id.slice(0, -6), value);
  copyTheme(puzzle);
  copyImage(puzzle);
  writePuzzle();
}

window.changeImage = function (id, value) {
  if (!value.length) value = 'none';
  else value = `url(${value})`;
  document.documentElement.style.setProperty('--' + id.slice(0, -6), value);
  copyImage(puzzle);
  reloadPuzzle();
  writePuzzle();
}

function applyThemeButton() {
  for (const entry of themeArgs) {
    document.getElementById(entry+'-color').value = getComputedStyle(document.documentElement).getPropertyValue('--' + entry);
  }
}
function applyImageButton() {
  for (const entry of imageArgs) {
    let res = getComputedStyle(document.documentElement).getPropertyValue('--' + entry);
    if (res == 'none') document.getElementById(entry+'-input').value = "";
    else document.getElementById(entry+'-input').value = res.slice(4, -1).replace(/\\/g, '');
  }
}

window.exportTheme = function () { navigator.clipboard.writeText(serializeTheme(puzzle)).then(); }

window.importTheme = function () {
  navigator.clipboard.readText().then((clipText) => {
    deserializeTheme(puzzle, clipText)
    applyThemeButton();
    applyImageButton();
    writePuzzle();
  });
}

window.resetTheme = function () {
  deserializeTheme(puzzle, 'vt1_AP---wDW1tYAs7Oz~6ABwcHAAxMTEAP---wCI--8A--8iAA__');
  applyThemeButton();
  applyImageButton();
  writePuzzle();
}

window.randomizeTheme = function () {
  puzzle.theme['line-primary'] = 8978431;
  puzzle.theme['line-secondary'] = 16776994;
  let invert = (Math.random() > 0.5);
  let hue = Math.random();
  let hueIncrement = (Math.random() - 0.5) / 12;
  let saturation = Math.random() / 10;
  let saturationIncrement = (Math.random() - 0.5) / 12;
  if (saturationIncrement < 0) {
    saturation = 1 - saturation;
    saturationIncrement *= -1;
  }
  if (invert) {
    puzzle.theme['line-success'] = 16777215;
    puzzle.theme['background'] = HSVtoRGB(hue, saturation, 1 / 8);
    puzzle.theme['outer'] = HSVtoRGB(hue + (hueIncrement), saturation + (saturationIncrement), 1 / 4);
    puzzle.theme['line-undone'] = HSVtoRGB(hue + (hueIncrement * 2), saturation + (saturationIncrement), 1 / 2);
    puzzle.theme['inner'] = HSVtoRGB(hue + (hueIncrement * 3), saturation + (saturationIncrement * 2), 2 / 3);
    puzzle.theme['line-default'] = HSVtoRGB(hue + (hueIncrement * 4), saturation + (saturationIncrement * 4), 3 / 4);
    puzzle.theme['text'] = HSVtoRGB(hue + (hueIncrement * 5), saturation + (saturationIncrement * 6), 7 / 8);
  } else {
    puzzle.theme['text'] = 0;
    puzzle.theme['line-default'] = HSVtoRGB(hue, saturation, 1 / 8);
    puzzle.theme['line-success'] = HSVtoRGB(hue + (hueIncrement), saturation + (saturationIncrement), 1 / 4);
    puzzle.theme['line-undone'] = HSVtoRGB(hue + (hueIncrement * 2), saturation + (saturationIncrement), 1 / 2);
    puzzle.theme['inner'] = HSVtoRGB(hue + (hueIncrement * 3), saturation + (saturationIncrement * 2), 2 / 3);
    puzzle.theme['outer'] = HSVtoRGB(hue + (hueIncrement * 4), saturation + (saturationIncrement * 4), 3 / 4);
    puzzle.theme['background'] = HSVtoRGB(hue + (hueIncrement * 5), saturation + (saturationIncrement * 6), 7 / 8);
  }
  applyTheme(puzzle);
  applyImage(puzzle);
  applyThemeButton();
  applyImageButton();
  writePuzzle();
}

function HSVtoRGB(h, s, v) {
  var r, g, b, i, f, p, q, t;
  if (arguments.length === 1) {
      s = h.s, v = h.v, h = h.h;
  }
  h = ((h % 1) + 1) % 1;
  s = Math.max(Math.min(s, 1), 0);
  v = Math.max(Math.min(v, 1), 0);
  i = Math.floor(h * 6);
  f = h * 6 - i;
  p = v * (1 - s);
  q = v * (1 - f * s);
  t = v * (1 - (1 - f) * s);
  switch (i % 6) {
      case 0: r = v, g = t, b = p; break;
      case 1: r = q, g = v, b = p; break;
      case 2: r = p, g = v, b = t; break;
      case 3: r = p, g = q, b = v; break;
      case 4: r = t, g = p, b = v; break;
      case 5: r = v, g = p, b = q; break;
  }
  return parseInt(`${Math.round(r * 255).toString(16).padStart(2, '0')}${Math.round(g * 255).toString(16).padStart(2, '0')}${Math.round(b * 255).toString(16).padStart(2, '0')}`, 16);
}

window.exportPuzzle = function() { navigator.clipboard.writeText('https://prodzpod.github.io/witness#' + serializePuzzle(puzzle)).then(); }

window.importPuzzle = function() {
  navigator.clipboard.readText().then(clipText => {
    deserializePuzzle(clipText.replace(/https:.+?#/, ''));
    applyThemeButton();
    applyImageButton();
    updateSoundDotsList();
    reloadPuzzle();
    writePuzzle();
    document.getElementById('deleteButton').disabled = true
  });
}

});
