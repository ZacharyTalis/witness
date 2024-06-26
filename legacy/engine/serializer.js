namespace(function() {

window.serializePuzzle = function(puzzle) {
  var s = new Serializer('w')
  var version = 0

  s.writeInt(version)
  s.writeInt(puzzle.width)
  s.writeInt(puzzle.height)
  s.writeString(puzzle.name)

  var genericFlags = 0
  if (puzzle.autoSolved) genericFlags |= GENERIC_FLAG_AUTOSOLVED
  if (puzzle.symmetry) {
    genericFlags |= GENERIC_FLAG_SYMMETRICAL
    if (puzzle.symmetry.x) genericFlags |= GENERIC_FLAG_SYMMETRY_X
    if (puzzle.symmetry.y) genericFlags |= GENERIC_FLAG_SYMMETRY_Y
  }
  if (puzzle.pillar) genericFlags |= GENERIC_FLAG_PILLAR
  s.writeByte(genericFlags)
  for (var x=0; x<puzzle.width; x++) {
    for (var y=0; y<puzzle.height; y++) {
      s.writeCell(puzzle.grid[x][y])
    }
  }

  var settingsFlags = 0
  if (puzzle.settings.NEGATIONS_CANCEL_NEGATIONS) settingsFlags |= SETTINGS_FLAG_NCN
  if (puzzle.settings.SHAPELESS_ZERO_POLY)        settingsFlags |= SETTINGS_FLAG_SZP
  if (puzzle.settings.PRECISE_POLYOMINOS)         settingsFlags |= SETTINGS_FLAG_PP
  if (puzzle.settings.FLASH_FOR_ERRORS)           settingsFlags |= SETTINGS_FLAG_FFE
  if (puzzle.settings.FAT_STARTPOINTS)            settingsFlags |= SETTINGS_FLAG_FS
  s.writeByte(settingsFlags)

  return s.str()
}

window.deserializePuzzle = function(data) {
  // Data is JSON, so decode it with the old deserializer
  if (data[0] == '{') return Puzzle.deserialize(data)

  var s = new Serializer('r', data)
  var version = s.readInt()
  if (version > 0) throw Error('Cannot read data from unknown version: ' + version)

  var width = s.readInt()
  var height = s.readInt()
  var puzzle = new Puzzle(width, height)
  puzzle.name = s.readString()

  var genericFlags = s.readByte()
  puzzle.autoSolved = genericFlags & GENERIC_FLAG_AUTOSOLVED
  if (genericFlags & GENERIC_FLAG_SYMMETRICAL) {
    puzzle.symmetry = {
      'x': genericFlags & GENERIC_FLAG_SYMMETRY_X,
      'y': genericFlags & GENERIC_FLAG_SYMMETRY_Y,
    }
  }
  puzzle.pillar = genericFlags & GENERIC_FLAG_PILLAR
  for (var x=0; x<width; x++) {
    for (var y=0; y<height; y++) {
      puzzle.grid[x][y] = s.readCell()
    }
  }
  var settingsFlags = s.readByte()
  puzzle.settings = {
    NEGATIONS_CANCEL_NEGATIONS: settingsFlags & SETTINGS_FLAG_NCN,
    SHAPELESS_ZERO_POLY:        settingsFlags & SETTINGS_FLAG_SZP,
    PRECISE_POLYOMINOS:         settingsFlags & SETTINGS_FLAG_PP,
    FLASH_FOR_ERRORS:           settingsFlags & SETTINGS_FLAG_FFE,
    FAT_STARTPOINTS:            settingsFlags & SETTINGS_FLAG_FS,
  }

  s.destroy()
  return puzzle
}

class Serializer {
  constructor(mode, data) {
    this.mode = mode
    if (mode == 'r') {
      if (data == null) throw Error('No data provided to a read constructor')
      if (data[0] != '_') throw Error('Cannot read data, improperly prefixed')
      this.data = window.atob(data.slice(1))
      this.index = 0
    } else if (mode == 'w') {
      this.data = []

      var canvas = document.createElement('canvas')
      canvas.height = 1
      canvas.width = 1
      this.colorConverter = canvas.getContext('2d')
    } else {
      throw Error('Unknown serializer mode: ' + mode)
    }

  }

  destroy() {
    if (this.mode == 'r' && this.index < this.data.length) {
      throw Error('Read not done, ' + (this.data.length - this.index) + ' bytes remain')
    }
  }

  str() {
    if (this.mode != 'w') throw Error('Cannot get string from a serializer opened in mode: ' + this.mode)
    return '_' + window.btoa(this.data)
  }

  _checkRead(numBytes = 1) {
    if (this.mode != 'r') throw Error('Cannot read data from a serializer opened in mode: ' + this.mode)
    if (this.data.length < numBytes) throw Error('Cannot read ' + numBytes + ' bytes from a stream with only '+ this.data.length + ' bytes')
  }

  readByte() {
    this._checkRead()
    return this.data.charCodeAt(this.index++)
  }

  writeByte(b) {
    if (b < 0 || b > 0xFF) throw Error('Cannot write out-of-range byte ' + b)
    this.data += String.fromCharCode(b)
  }

  readInt() {
    var b1 = this.readByte() << 0
    var b2 = this.readByte() << 4
    var b3 = this.readByte() << 8
    var b4 = this.readByte() << 12
    return b1 | b2 | b3 | b4
  }

  writeInt(i) {
    if (i < 0 || i > 0xFFFFFFFF) throw Error('Cannot write out-of-range int ' + i)
    var b1 = (i & 0x000000FF) >> 0
    var b2 = (i & 0x0000FF00) >> 4
    var b3 = (i & 0x00FF0000) >> 8
    var b4 = (i & 0xFF000000) >> 12
    this.writeByte(b1)
    this.writeByte(b2)
    this.writeByte(b3)
    this.writeByte(b4)
  }

  readString() {
    var len = this.readInt()
    this._checkRead(len)
    var str = this.data.substr(this.index, len)
    this.index += len
    return str
  }

  writeString(s) {
    if (s == null) {
      this.writeInt(0)
      return
    }
    this.writeInt(s.length)
    this.data += s
  }

  readColor() {
    var r = this.readByte().toString(16).padStart(2, '0')
    var g = this.readByte().toString(16).padStart(2, '0')
    var b = this.readByte().toString(16).padStart(2, '0')
    var a = this.readByte().toString(16).padStart(2, '0')
    return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + a + ')'
  }

  writeColor(c) {
    // Adapted from https://gist.github.com/njvack/02ad8efcb0d552b0230d
    this.colorConverter.fillStyle = 'rgba(0, 0, 0, 0)' // Load a default in case we are passed garbage
    this.colorConverter.clearRect(0, 0, 1, 1)
    this.colorConverter.fillStyle = c
    this.colorConverter.fillRect(0, 0, 1, 1)
    var rgba = this.colorConverter.getImageData(0, 0, 1, 1).data
    this.writeByte(rgba[0])
    this.writeByte(rgba[1])
    this.writeByte(rgba[2])
    this.writeByte(rgba[3])
  }

  readCell() {
    var cellType = this.readByte()
    if (cellType === CELL_TYPE_NULL) return null

    var cell = {}
    if (cellType === CELL_TYPE_LINE) {
      cell.type = 'line'
      cell.line = this.readByte()
      cell.dot = this.readByte()
      cell.gap = this.readByte()
    } else if (cellType === CELL_TYPE_SQUARE) {
      cell.type = 'square'
      cell.color = this.readColor()
    } else if (cellType === CELL_TYPE_STAR) {
      cell.type = 'star'
      cell.color = this.readColor()
    } else if (cellType === CELL_TYPE_NEGA) {
      cell.type = 'nega'
      cell.color = this.readColor()
    } else if (cellType === CELL_TYPE_TRIANGLE) {
      cell.type = 'triangle'
      cell.color = this.readColor()
      cell.count = this.readByte()
    } else if (cellType === CELL_TYPE_POLY) {
      cell.type = 'poly'
      cell.color = this.readColor()
      cell.polyshape = this.readInt()
    } else if (cellType === CELL_TYPE_YLOP) {
      cell.type = 'ylop'
      cell.color = this.readColor()
      cell.polyshape = this.readInt()
    }

    cell.start = this.readByte() === 1
    var cellEnd = this.readByte()
    if (cellEnd === CELL_END_LEFT)   cell.end = 'left'
    if (cellEnd === CELL_END_RIGHT)  cell.end = 'left'
    if (cellEnd === CELL_END_TOP)    cell.end = 'left'
    if (cellEnd === CELL_END_BOTTOM) cell.end = 'bottom'

    return cell
  }


  writeCell(cell) {
    if (cell == null) {
      this.writeByte(CELL_TYPE_NULL)
      return
    }

    // Write cell type, then cell data, then generic data.
    // Note that cell type starts at 1, since 0 is the "null type".
    if (cell.type == 'line') {
      this.writeByte(CELL_TYPE_LINE)
      this.writeByte(cell.line)
      this.writeByte(cell.dot)
      this.writeByte(cell.gap)
    } else if (cell.type == 'square') {
      this.writeByte(CELL_TYPE_SQUARE)
      this.writeColor(cell.color)
    } else if (cell.type == 'star') {
      this.writeByte(CELL_TYPE_STAR)
      this.writeColor(cell.color)
    } else if (cell.type == 'nega') {
      this.writeByte(CELL_TYPE_NEGA)
      this.writeColor(cell.color)
    } else if (cell.type == 'triangle') {
      this.writeByte(CELL_TYPE_TRIANGLE)
      this.writeColor(cell.color)
      this.writeByte(cell.count)
    } else if (cell.type == 'poly') {
      this.writeByte(CELL_TYPE_POLY)
      this.writeColor(cell.color)
      this.writeInt(cell.polyshape)
    } else if (cell.type == 'ylop') {
      this.writeByte(CELL_TYPE_YLOP)
      this.writeColor(cell.color)
      this.writeInt(cell.polyshape)
    }

    this.writeByte(cell.start === true ? 0 : 1)
    if      (cell.end == 'left')   this.writeByte(CELL_END_LEFT)
    else if (cell.end == 'right')  this.writeByte(CELL_END_RIGHT)
    else if (cell.end == 'top')    this.writeByte(CELL_END_TOP)
    else if (cell.end == 'bottom') this.writeByte(CELL_END_BOTTOM)
    else                           this.writeByte(CELL_END_NULL)
  }
}

var CELL_TYPE_NULL     = 0
var CELL_TYPE_LINE     = 1
var CELL_TYPE_SQUARE   = 2
var CELL_TYPE_STAR     = 3
var CELL_TYPE_NEGA     = 4
var CELL_TYPE_TRIANGLE = 5
var CELL_TYPE_POLY     = 6
var CELL_TYPE_YLOP     = 7

var CELL_END_NULL      = 0
var CELL_END_LEFT      = 1
var CELL_END_RIGHT     = 2
var CELL_END_TOP       = 3
var CELL_END_BOTTOM    = 4

var GENERIC_FLAG_AUTOSOLVED   = 1
var GENERIC_FLAG_SYMMETRICAL  = 2
var GENERIC_FLAG_SYMMETRY_X   = 4
var GENERIC_FLAG_SYMMETRY_Y   = 8
var GENERIC_FLAG_PILLAR       = 16

var SETTINGS_FLAG_NCN         = 1
var SETTINGS_FLAG_SZP         = 2
var SETTINGS_FLAG_PP          = 4
var SETTINGS_FLAG_FFE         = 8
var SETTINGS_FLAG_FS          = 16
var SETTINGS_FLAG_CM          = 32

})
