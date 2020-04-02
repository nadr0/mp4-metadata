/**
 * Converts a file or blob into an unsigned integers of 8 bytes array. 
 * @param {(File | Blob)} file 
 * @return {Uint8Array}
 */
const FileBlobToUint8Array = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(new Uint8Array(reader.result));
    }
    
    reader.onerror = (e) => {
      reject(e);
    }

    reader.readAsArrayBuffer(file);
  });
}

/**
 * seconds in Mac HFS+ to be converted into a date time iso string
 * @param {Number} seconds - Mac HFS+ seconds
 * @return {String} date time iso string
 */
const macHFSPlusToISOString = (seconds) => {
  // offset seconds and multipled by 1000 to use seconds in javascript date.
  return new Date((seconds - 2082844800) * 1000).toISOString();
}

/**
 * Convert an array of bytes into a hex string
 * @param {Uint8Array} byteArray 
 * @param {String} hex version of the original byte array
 */
const toHexString = (byteArray) => {
  return Array.from(byteArray, (byte) => {
    return ('0' + (byte & 0xFF).toString(16)).slice(-2);
  }).join('')
}

/**
 * Converts a string of hex values into its decimal representation
 * @param {String} hexString 
 * @param {Number} decimal version of the hex string
 */
const toDecimalFromHexString = (hexString) => {
  return parseInt(hexString, 16);
}

/**
 * Convert an array of unsigned integers of 8 bytes into a string of chars.
 * This will convert each decimal value to a char and concat all the chars
 * together to form the string.
 * @param {Uint8Array} byteArray 
 * @param {String} string representation of the original byte array
 */
const uint8ToCharCodeString = (byteArray) => {
  return Array.from(byteArray, (byte) => {
    return String.fromCharCode(byte);
  }).join('')
}


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
const parseBytesAfterMvhd = (uInt8Chunk) => {
  const version = toDecimalFromHexString(toHexString([uInt8Chunk[0]]));
  let seconds = null;
  if (version === 0) {
    // read the 4 byte creation time
    const start = 4; // 1 byte for version, 3 bytes of flags
    const end = start + 4; // offset from the start for the 4 bytes of creation time
    const createdBytes = uInt8Chunk.slice(start, end);
    seconds = toDecimalFromHexString(toHexString(createdBytes));
  } else if (version === 1) {
    // read the 8 creation time
    const start = 4; // 1 byte for version, 3 bytes of flags
    const end = start + 8; // offset from the start for the 8 bytes of creation time
    const createdBytes = uInt8Chunk.slice(start, end);
    seconds = toDecimalFromHexString(toHexString(createdBytes));
  }

  return seconds === null ? null : macHFSPlusToISOString(seconds);
}

/**
 * Reads a file backwards to find the index of the str you are searching for
 * i.g. you can search for moov, mvhd, etc...
 * @param {(File | Blob)} file 
 * @param {String} str - String contents you are trying to search in the file
 * @param {Number} defaultChunkSize chunk size to read in bytes
 * @param {Number} maxBytesRead number of bytes to read before killing
 * @return {Number} globalFileIndex the global file index were the str begins in
 *  the original file
 */
const readFileByChunksBackwardsForStringIndex = async (file, str, defaultChunkSize, maxBytesRead) =>{
  const chunkSize = file.size < defaultChunkSize ? file.size : defaultChunkSize 
  let iteration = 0;
  let start = null;
  let end = file.size - (chunkSize * iteration);
  let indexOfStr = null;
  let globalFileIndex = null;
  let strLengthEdgeCase = str.length - 1;

  // read backwards
  while (end > 0 && (iteration * chunkSize) < maxBytesRead) {
    start = file.size - (chunkSize * (iteration + 1)); 
    start = start < 0 ? 0 : start;
    end = file.size - (chunkSize * iteration);

    // since we are reading by a random chunk size we have a few edge conditions to worry about
    // chunk bounds
    const chunk = file.slice(start, end + strLengthEdgeCase);
    const uint8Chunk = await FileBlobToUint8Array(chunk);
    const charCodeString = uint8ToCharCodeString(uint8Chunk);

    indexOfStr = charCodeString.indexOf(str);
    if (indexOfStr !== -1) {
      // Since we are reading backwards from the end of the file read, compute
      // the global file index of where the str begins
      globalFileIndex = file.size - ((iteration * chunkSize) + (chunkSize - 1 - indexOfStr)) - 1;
      break;
    }

    iteration++;
  }
  return globalFileIndex;
}

/**
 * Retrieves the creation time of the mp4 video
 * @param {(File | Blob)} file 
 * @param options configuration options for the parser
 * @param options.defaultChunkSize the default chunk size to parse per iteration in bytes
 * @param options.maxBytesRead the amount of bytes the parser will read before stopping. Make this the file size to read the entire file.
 * @return {(String | null)} a date time iso string of the creation time or null
 */
const getCreationTime = async (file, options={}) => {
  const defaultChunkSize = options.defaultChunkSize ? options.defaultChunkSize : 100000;
  const maxBytesRead = options.maxBytesRead ? options.maxBytesRead : 100000000;

  const globalFileIndex = await readFileByChunksBackwardsForStringIndex(file, 'mvhd', defaultChunkSize, maxBytesRead);
  if (!globalFileIndex) return null;

  // global file index points the start of m in mvhd, lets move it 4 bytes past this str name
  // now it will point at the version
  const parsingIndex = globalFileIndex + 4;
  
  // move it 12 bytes ahead to parse either version of the creation time
  // 4 for version + flags
  // 8 for the creation time
  // 12 in total
  const fileChunk = file.slice(parsingIndex, globalFileIndex + 12);
  const uInt8Chunk = await FileBlobToUint8Array(fileChunk);
  const creationTime = parseBytesAfterMvhd(uInt8Chunk);

  return creationTime;
}

export default {
  getCreationTime
};