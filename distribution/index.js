"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

/**
 * Converts a file or blob into an unsigned integers of 8 bytes array. 
 * @param {(File | Blob)} file 
 * @return {Uint8Array}
 */
var FileBlobToUint8Array = function FileBlobToUint8Array(file) {
  return new Promise(function (resolve, reject) {
    var reader = new FileReader();

    reader.onload = function () {
      resolve(new Uint8Array(reader.result));
    };

    reader.onerror = function (e) {
      reject(e);
    };

    reader.readAsArrayBuffer(file);
  });
};
/**
 * seconds in Mac HFS+ to be converted into a date time iso string
 * @param {Number} seconds - Mac HFS+ seconds
 * @return {String} date time iso string
 */


var macHFSPlusToISOString = function macHFSPlusToISOString(seconds) {
  // offset seconds and multipled by 1000 to use seconds in javascript date.
  return new Date((seconds - 2082844800) * 1000).toISOString();
};
/**
 * Convert an array of bytes into a hex string
 * @param {Uint8Array} byteArray 
 * @param {String} hex version of the original byte array
 */


var toHexString = function toHexString(byteArray) {
  return Array.from(byteArray, function (_byte) {
    return ('0' + (_byte & 0xFF).toString(16)).slice(-2);
  }).join('');
};
/**
 * Converts a string of hex values into its decimal representation
 * @param {String} hexString 
 * @param {Number} decimal version of the hex string
 */


var toDecimalFromHexString = function toDecimalFromHexString(hexString) {
  return parseInt(hexString, 16);
};
/**
 * Convert an array of unsigned integers of 8 bytes into a string of chars.
 * This will convert each decimal value to a char and concat all the chars
 * together to form the string.
 * @param {Uint8Array} byteArray 
 * @param {String} string representation of the original byte array
 */


var uint8ToCharCodeString = function uint8ToCharCodeString(byteArray) {
  return Array.from(byteArray, function (_byte2) {
    return String.fromCharCode(_byte2);
  }).join('');
};
/**
 * Reads the bytes after the mvhd str to parse the creation date only. 
 * 
 * 8+ bytes movie (presentation) header box
 *    = long unsigned offset + long ASCII text string 'mvhd'
 *  -> 1 byte version = 8-bit unsigned value
 *    - if version is 1 then date and duration values are 8 bytes in length
 *  -> 3 bytes flags =  24-bit hex flags (current = 0)
 *
 *  -> 4 bytes created mac UTC date
 *      = long unsigned value in seconds since beginning 1904 to 2040
 *  -> 4 bytes modified mac UTC date
 *      = long unsigned value in seconds since beginning 1904 to 2040
 *  OR
 *  -> 8 bytes created mac UTC date
 *      = 64-bit unsigned value in seconds since beginning 1904
 *  -> 8 bytes modified mac UTC date
 *      = 64-bit unsigned value in seconds since beginning 1904
 * @param {Uint8Array} uInt8Chunk 
 * @return {(String | null)} ISO Datetime string or null if no creation date
 * was found 
 */


var parseBytesAfterMvhd = function parseBytesAfterMvhd(uInt8Chunk) {
  var version = toDecimalFromHexString(toHexString([uInt8Chunk[0]]));
  var seconds = null;

  if (version === 0) {
    // read the 4 byte creation time
    var start = 4; // 1 byte for version, 3 bytes of flags

    var end = start + 4; // offset from the start for the 4 bytes of creation time

    var createdBytes = uInt8Chunk.slice(start, end);
    seconds = toDecimalFromHexString(toHexString(createdBytes));
  } else if (version === 1) {
    // read the 8 creation time
    var _start = 4; // 1 byte for version, 3 bytes of flags

    var _end = _start + 8; // offset from the start for the 8 bytes of creation time


    var _createdBytes = uInt8Chunk.slice(_start, _end);

    seconds = toDecimalFromHexString(toHexString(_createdBytes));
  }

  return seconds === null ? null : macHFSPlusToISOString(seconds);
};
/**
 * Reads a file backwards to find the index of the str you are searching for
 * i.g. you can search for moov, mvhd, etc...
 * @param {(File | Blob)} file 
 * @param {String} str - String contents you are trying to search in the file
 * @param {*} defaultChunkSize 
 * @param {*} maxBytesRead 
 */


var readFileByChunksBackwardsForStringIndex = /*#__PURE__*/function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(file, str) {
    var defaultChunkSize,
        maxBytesRead,
        chunkSize,
        iteration,
        start,
        end,
        indexOfStr,
        globalFileIndex,
        strLengthEdgeCase,
        chunk,
        uint8Chunk,
        charCodeString,
        _args = arguments;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            defaultChunkSize = _args.length > 2 && _args[2] !== undefined ? _args[2] : 1000000;
            maxBytesRead = _args.length > 3 && _args[3] !== undefined ? _args[3] : 100000000;
            chunkSize = file.size < defaultChunkSize ? file.size : defaultChunkSize;
            iteration = 0;
            start = null;
            end = file.size - chunkSize * iteration;
            indexOfStr = null;
            globalFileIndex = null;
            strLengthEdgeCase = str.length - 1; // read backwards

          case 9:
            if (!(end > 0 && iteration * chunkSize < maxBytesRead)) {
              _context.next = 25;
              break;
            }

            start = file.size - chunkSize * (iteration + 1);
            start = start < 0 ? 0 : start;
            end = file.size - chunkSize * iteration; // since we are reading by a random chunk size we have a few edge conditions to worry about
            // chunk bounds

            chunk = file.slice(start, end + strLengthEdgeCase);
            _context.next = 16;
            return FileBlobToUint8Array(chunk);

          case 16:
            uint8Chunk = _context.sent;
            charCodeString = uint8ToCharCodeString(uint8Chunk);
            indexOfStr = charCodeString.indexOf(str);

            if (!(indexOfStr !== -1)) {
              _context.next = 22;
              break;
            }

            // Since we are reading backwards from the end of the file read, compute
            // the global file index of where the str begins
            globalFileIndex = file.size - (iteration * chunkSize + (chunkSize - 1 - indexOfStr)) - 1;
            return _context.abrupt("break", 25);

          case 22:
            iteration++;
            _context.next = 9;
            break;

          case 25:
            return _context.abrupt("return", globalFileIndex);

          case 26:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));

  return function readFileByChunksBackwardsForStringIndex(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();
/**
 * Retrieves the creation time of the mp4 video
 * @param {(File | Blob)} file 
 * @return {(String | null)} a date time iso string of the creation time or null
 */


var getCreationTime = /*#__PURE__*/function () {
  var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(file) {
    var globalFileIndex, parsingIndex, fileChunk, uInt8Chunk, creationTime;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2;
            return readFileByChunksBackwardsForStringIndex(file, 'mvhd');

          case 2:
            globalFileIndex = _context2.sent;

            if (globalFileIndex) {
              _context2.next = 5;
              break;
            }

            return _context2.abrupt("return", null);

          case 5:
            // global file index points the start of m in mvhd, lets move it 4 bytes past this str name
            // now it will point at the version
            parsingIndex = globalFileIndex + 4; // move it 12 bytes ahead to parse either version of the creation time
            // 4 for version + flags
            // 8 for the creation time
            // 12 in total

            fileChunk = file.slice(parsingIndex, globalFileIndex + 12);
            _context2.next = 9;
            return FileBlobToUint8Array(fileChunk);

          case 9:
            uInt8Chunk = _context2.sent;
            creationTime = parseBytesAfterMvhd(uInt8Chunk);
            return _context2.abrupt("return", creationTime);

          case 12:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  }));

  return function getCreationTime(_x3) {
    return _ref2.apply(this, arguments);
  };
}();

var _default = {
  getCreationTime: getCreationTime
};
exports["default"] = _default;