namespace(function() {

window.Region = class {
  constructor(length) {
    this.cells = []
    this.grid = []
    for (var x=0; x<length; x++) {
      this.grid.push(0)
    }
  }

  getCell(x, y) {
    return ((this.grid[x] & (1 << y)) !== 0)
  }

  setCell(x, y) {
    if (this.getCell(x, y)) return
    this.grid[x] |= (1 << y)
    this.cells.push({'x':x, 'y':y})
  }
}

// A 2x2 grid is internally a 5x5:
// corner, edge, corner, edge, corner
// edge,   cell, edge,   cell, edge
// corner, edge, corner, edge, corner
// edge,   cell, edge,   cell, edge
// corner, edge, corner, edge, corner
//
// Corners and edges will have a value of true if the line passes through them
// Cells will contain an object if there is an element in them
window.Puzzle = class {

  constructor(width, height, pillar=[false, false]) {
    let json;
    if (!height) {
      json = width;
      width = Math.floor(json.width / 2);
      height = Math.floor(json.height / 2);
      pillar = json.pillar;
    }
    if (!Array.isArray(pillar)) pillar = [pillar, false];
    this.newGrid(2 * width + (!pillar[0]), 2 * height + (!pillar[1]))
    this.pillar = pillar;
    this.symmetry = [0, 0, false];
    this.sols = 1;
    this.soundDots = [];
    if (json) {
      if (json.perfect) this.sols = 0;
      this.grid = json.grid;
      this.theme = json.theme;
      this.image = json.image;
    }
    this.theme = Object.fromEntries(themeArgs.map(x => [x, undefined]));
    this.image = Object.fromEntries(imageArgs.map(x => [x, undefined]));
    this.transform = {
      'translate': [0, 0],
      'perspective': 0,
      'rotate': [0, 0],
      'scale': [100, 100],
      'skew': [0, 0],
    };
    this.endDest = [0, 0, 0];
  }

  // This is explicitly *not* just clearing the grid, so that external references
  // to the grid are not also cleared.
  newGrid(width, height) {
    if (width == null) { // Called by someone who just wants to clear the grid.
      width = this.width
      height = this.height
    }
    this.grid = []
    for (var x=0; x<width; x++) {
      this.grid[x] = []
      for (var y=0; y<height; y++) {
        if (x%2 === 1 && y%2 === 1) this.grid[x][y] = null
        else this.grid[x][y] = {'type':'line', 'line':LINE_NONE}
      }
    }
    // Performance: A large value which is === 0 to be used for pillar wrapping.
    // Performance: Getting the size of the grid has a nonzero cost.
    // Definitely getting the length of the first element isn't optimized.
    this.largezero = width * height * 2
    this.width = this.grid.length
    this.height = this.grid[0].length
  }

  // Wrap a value around at the width of the grid. No-op if not in pillar mode.
  _mod(val) {
    if (this.pillar === false) return val
    return (val + this.largezero) % this.width
  }

  // new _mod, used for both x, y
  mod(x, y) {
    if (this.pillar[0]) x = rdiv(x, this.width);
    if (this.pillar[1]) y = rdiv(y, this.height);
    return [x, y];
  }

  // Determine if an x, y pair is a safe reference inside the grid. This should be invoked at the start of every
  // function, but then functions can access the grid directly.
  _safeCell(x, y) {
    if (x < 0 || x >= this.width) return false
    if (y < 0 || y >= this.height) return false
    return true
  }

  getCell(x, y) {
    [x, y] = this.mod(x, y);
    if (!this._safeCell(x, y)) return null
    return this.grid[x][y]
  }

  setCell(x, y, value) {
    [x, y] = this.mod(x, y);
    if (!this._safeCell(x, y)) return
    this.grid[x][y] = value
  }

  getSymmetricalDir(dir) {
    let z = endEnum.indexOf(dir);
    if (!this.isSymmetry() || ![0, 1, 2, 3].includes(z)) return dir;
    if (this.symmetry[0] === 1)    z = [0, 2, 1, 3][z];
    if (this.symmetry[1] === 1)    z = [3, 1, 2, 0][z];
    if (this.symmetry[2] === true) z = [2, 3, 0, 1][z];
    return endEnum[z];
  }

  getSymmetricalPos(x, y) {
    if (!this.isSymmetry()) return [x, y];
    [x, y] = this.mod(x, y);
    if (this.symmetry[2]) {
      let temp = y;
      y = x;
      x = temp;
    }
    x = [x, this.width - x - 1, (
      rdiv(x + (mdiv(this.width + 2, 4) / 2), (mdiv(this.width + 2, 4)))
    ), x, (this.width/2) - x, (this.width/2) + x][Number(this.symmetry[0]) + (3 * !!this.pillar[0])];
    y = [y, this.height - y - 1, rdiv(y + ((this.height-1)/2), this.height-1), y, (this.height/2) - y, (this.height/2) + y][Number(this.symmetry[1]) + (3 * !!this.pillar[1])];
    [x, y] = this.mod(x, y);
    return [x, y];
  }

  getSymmetricalCell(x, y) {
    var pos = this.getSymmetricalPos(x, y)
    return this.getCell(...pos)
  }

  matchesSymmetricalPos(x1, y1, x2, y2) {
    [x1, y1] = this.mod(x1, y1);
    return (x1 === x2 && y1 === y2)
  }

  isTranslateJank(x, y) {
    if (x === ((this.width-1)/2) && puzzle.symmetry[0] === 2) return true;
    if (y === ((this.height-1)/2) && puzzle.symmetry[1] === 2) return true;
    return false;
  }

  isSymmetry() {
    return this.symmetry[0] !== 0 || this.symmetry[1] !== 0 || this.symmetry[2] !== false;
  }

  isPillar() {
    return this.pillar[0] !== false || this.pillar[1] !== false;
  }

  // A variant of getCell which specifically returns line values,
  // and treats objects as being out-of-bounds
  getLine(x, y) {
    var cell = this.getCell(x, y)
    if (cell == null) return null
    if (cell.type !== 'line') return null
    return cell.line
  }

  updateCell2(x, y, key, value) {
    x = this._mod(x)
    if (!this._safeCell(x, y)) return
    var cell = this.grid[x][y]
    if (cell == null) return
    cell[key] = value
  }


  getValidEndDirs(x, y) {
    let isEmpty = (puzzle, x, y) => {
      [x, y] = this.mod(x, y);
      if (0 > x && x >= puzzle.width) return true;
      if (0 > y && y >= puzzle.height) return true;
      let cell = puzzle.getCell(x, y);
      return cell == null || cell.gap == GAP_FULL;
    };
    [x, y] = this.mod(x, y);
    if (!this._safeCell(x, y)) return []
    var dirs = []
    if (isEmpty(this, x - 1, y) && isEmpty(this, ...this.getSymmetricalPos(x - 1, y))) dirs.push('left');
    if (isEmpty(this, x + 1, y) && isEmpty(this, ...this.getSymmetricalPos(x + 1, y))) dirs.push('right');
    if (isEmpty(this, x, y - 1) && isEmpty(this, ...this.getSymmetricalPos(x, y - 1))) dirs.push('top');
    if (isEmpty(this, x, y + 1) && isEmpty(this, ...this.getSymmetricalPos(x, y + 1))) dirs.push('bottom');
    return dirs
  }

  clearLines() {
    for (var x=0; x<this.width; x++) {
      for (var y=0; y<this.height; y++) {
        this.updateCell2(x, y, 'line', 0)
        this.updateCell2(x, y, 'dir', null)
      }
    }
  }

  _floodFill(x, y, region) {
    // Inlined safety checks so we can get the col, which is slightly more performant.
    x = this._mod(x)
    if (!this._safeCell(x, y)) return

    var col = this.grid[x]
    var cell = col[y]
    if (cell === MASKED_PROCESSED) return
    if (cell !== MASKED_INB_NONCOUNT) {
      region.setCell(x, y)
    }
    col[y] = MASKED_PROCESSED

    this._floodFill(x, y + 1, region)
    this._floodFill(x + 1, y, region)
    this._floodFill(x, y - 1, region)
    this._floodFill(x - 1, y, region)
  }

  // Re-uses the same grid, but only called on edges which border the outside
  // Called first to mark cells that are connected to the outside, i.e. should not be part of any region.
  _floodFillOutside(x, y) {
    // Needs safety checks because we're going around corners.
    // Inlined so that we can easily set the cell after.
    x = this._mod(x)
    if (!this._safeCell(x, y)) return
    var cell = this.grid[x][y]
    if (cell === MASKED_PROCESSED) return
    if (x%2 !== y%2 && cell !== MASKED_GAP2) return // Only flood-fill through gap-2
    if (x%2 === 0 && y%2 === 0 && cell === MASKED_DOT) return // Don't flood-fill through dots
    this.grid[x][y] = MASKED_PROCESSED

    if (x%2 === 0 && y%2 === 0) return // Don't flood fill through corners

    this._floodFillOutside(x, y + 1)
    this._floodFillOutside(x + 1, y)
    this._floodFillOutside(x, y - 1)
    this._floodFillOutside(x - 1, y)
  }

  // Returns the original grid (pre-masking). You will need to switch back once you are done flood filling.
  switchToMaskedGrid() {
    // Make a copy of the grid -- we will be overwriting it
    var savedGrid = this.grid
    this.grid = []
    // Override all elements with empty lines -- this means that flood fill is just
    // looking for lines with line=0.
    for (var x=0; x<this.width; x++) {
      var savedRow = savedGrid[x]
      var row = []
      for (var y=0; y<this.height; y++) {
        // Cells are always part of the region
        if (x%2 === 1 && y%2 === 1) {
          row.push(MASKED_INB_COUNT)
          continue;
        }

        var cell = savedRow[y]
        if (cell?.line > window.LINE_NONE) {
          row.push(MASKED_PROCESSED) // Traced lines should not be a part of the region
        } else if (cell?.gap === window.GAP_FULL) {
          row.push(MASKED_GAP2)
        } else if (cell?.dot > window.DOT_NONE) {
          row.push(MASKED_DOT)
        } else {
          row.push(MASKED_INB_COUNT)
        }
      }
      this.grid[x] = row
    }

    // Starting at a mid-segment startpoint
    if (this.startPoint != null && this.startPoint.x%2 !== this.startPoint.y%2) {
      // if (this.settings.FAT_STARTPOINTS) {
        // This segment is not in any region (acts as a barrier)
        this.grid[this.startPoint.x][this.startPoint.y] = MASKED_OOB
      // } else {
        // This segment is part of this region (acts as an empty cell)
        // this.grid[this.startPoint.x][this.startPoint.y] = MASKED_INB_NONCOUNT
      // }
    }

    // Ending at a mid-segment endpoint
    if (this.endPoint != null && this.endPoint.x%2 !== this.endPoint.y%2) {
      // This segment is part of this region (acts as an empty cell)
      this.grid[this._mod(this.endPoint.x)][this.endPoint.y] = MASKED_INB_NONCOUNT
    }

    // Mark all outside cells as 'not in any region' (aka null)

    if (this.pillar === false) {
      // Left and right edges (only applies to non-pillars)
      for (var y=1; y<this.height; y+=2) {
        this._floodFillOutside(0, y)
        this._floodFillOutside(this.width - 1, y)
      }
    }

    // Top and bottom edges
    for (var x=1; x<this.width; x+=2) {
      this._floodFillOutside(x, 0)
      this._floodFillOutside(x, this.height - 1)
    }

    return savedGrid
  }

  getRegions() {
    var regions = []
    var savedGrid = this.switchToMaskedGrid()
    for (var x=0; x<this.width; x++) {
      for (var y=0; y<this.height; y++) {
        if (this.grid[x][y] == MASKED_PROCESSED) continue;

        // If this cell is empty (aka hasn't already been used by a region), then create a new one
        // This will also mark all lines inside the new region as used.
        var region = new Region(this.width)
        this._floodFill(x, y, region)
        regions.push(region)
      }
    }
    this.grid = savedGrid
    return regions
  }

  getRegion(x, y) {
    x = this._mod(x)
    if (!this._safeCell(x, y)) return

    var savedGrid = this.switchToMaskedGrid()
    if (this.grid[x][y] == MASKED_PROCESSED) {
      this.grid = savedGrid
      return null
    }

    // If the masked grid hasn't been used at this point, then create a new region.
    // This will also mark all lines inside the new region as used.
    var region = new Region(this.width)
    this._floodFill(x, y, region)

    this.grid = savedGrid
    return region
  }

  logGrid() {
    var output = ''
    for (var y=0; y<this.height; y++) {
      for (var x=0; x<this.width; x++) {
        var cell = this.getCell(x, y)
        if (cell == null) output += ' '
        else if (typeof(cell) == 'number') output += cell
        else if (cell.start === true) output += 'S'
        else if (cell.end != null) output += 'E'
        else if (cell.type === 'line') {
          if (cell.line === 0) output += '.'
          if (cell.line === 1) output += '#'
          if (cell.line === 2) output += '#'
          if (cell.line === 3) output += 'o'
        }
        else output += '?'
      }
      output += '\n'
    }
    console.log(output)
  }
}

// The grid contains 5 colors:
// null: Out of bounds or already processed
var MASKED_OOB = null
var MASKED_PROCESSED = null
// 0: In bounds, awaiting processing, but should not be part of the final region.
var MASKED_INB_NONCOUNT = 0
// 1: In bounds, awaiting processing
var MASKED_INB_COUNT = 1
// 2: Gap-2. After _floodFillOutside, this means "treat normally" (it will be null if oob)
var MASKED_GAP2 = 2
// 3: Dot (of any kind), otherwise identical to 1. Should not be flood-filled through (why the f do we need this)
var MASKED_DOT = 3

})
