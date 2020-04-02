# mp4-parser

 mp4-parser is a client side javascript library that will parse the creation time of a mp4 video.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

# Example

```javascript
const mp4Metadata = require('mp4-metadata').default;

...

const mp4File = retrieveMp4File();
const creationTime = await mp4Metadata.getCreationTime(mp4File);
// 2016-06-03T20:51:02.000Z
```

# Usage

```
npm install mp4-metadata
```

See it out on npm [here](https://www.npmjs.com/package/mp4-metadata)

# Installation - local development or to build it yourself.

## Clone

 Clone `https://github.com/nadr0/mp4-metadata` to your machine

## Setup

We need to install all the dev dependencies for you to compile the source code into the distribution source.

```
npm install
```

## Build

To build the source code to ES5 run the following.

```
npm run build
```

## Usage

Building the repository should create `distribution/index.js`. This `index.js` file is all the source code of the library. Import it into whatever application you want.


# Code Structure

All the source for the library is in `source/index.js`. It is written in modern ES6+.

If you want to use the ES6+ source feel free to grab that file directly as well. If you do not have support for ES6+ please use the build command above to generate an ES5 distribution source.

# Features

I hope I update this library to parse all the metadata out of the `moov` atom inside an mp4 file. The only feature it supports now is getting the `creation time` of an mp4 file.


# Documentation

The only exposed function right now is called `getCreationTime`

```javascript
/**
 * Retrieves the creation time of the mp4 video
 * @param {(File | Blob)} file 
 * @return {(String | null)} a date time iso string of the creation time or null
 */
const getCreationTime = async (file) => { ... }
```

```javascript
const mp4Metadata = require('mp4-metadata').default;

const mp4File = retrieveMp4File();
const creationTime = await mp4Metadata.getCreationTime(mp4File);
// 2016-06-03T20:51:02.000Z
```

# Contributing

Feel free, make some issues make some PRs.

# FAQ

- Why only this one function? 
  - So far this was the only problem I needed to solve. I want to expand this further to parse out the rest of the metadata the same way.

# Support

Reach out to me at one of the following places

- Website at kevinnadro.com

# License

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
- [MIT License](https://opensource.org/licenses/mit-license.php)