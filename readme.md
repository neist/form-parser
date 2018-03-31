# Description
A streaming and asynchronous `multipart/form-data` parser.

# Install
```bash
npm install form-parser --save
```

# Examples

## Basic
```js
// Dependencies
const http = require('http')
const parser = require('form-parser')

// Create server
const server = http.createServer(async (req, res) => {
  // Wrap in try/catch block
  try {
    // Parse request
    await parser(req, async ({ fieldType, fieldName, fieldContent }) => {
      // Log info
      console.log({ fieldType, fieldName, fieldContent })
    })
  
  // Catch errors
  } catch (err) {
    // Log error
    console.error(err)

    // Reply with error
    res.statusCode = 400
    return res.end('Something went wrong.')
  }

  // Reply with success
  return res.end('Parsing form succeded.')
})

// Start server
server.listen(3000, () => {
  console.log('Listening on port 3000...')
})
```

## Streaming file upload
```js
// Dependencies
const http = require('http')
const parser = require('form-parser')
const path = require('path')
const fs = require('fs')

// Create server
const server = http.createServer(async (req, res) => {
  try {
    // Parse request
    await parser(req, async ({ fieldType, fieldName, fieldContent }) => {
      // Log info
      console.log({ fieldType, fieldName, fieldContent })

      // Handle files
      if (fieldType === 'file') {
        // Get file info
        const { fileName, fileType, fileStream } = fieldContent

        // Prepare write stream
        const writeFilePath = path.resolve(__dirname, 'files', fileName)
        const writeFileStream = fs.createWriteStream(writeFilePath)

        // Write file to disk
        await new Promise((resolve, reject) => {
          fileStream.pipe(writeFileStream).on('error', reject).on('finish', resolve)
        })

        // Log info
        console.log(`${fileName} has been written to disk.`)
      }
    })
  
  // Catch errors
  } catch (err) {
    // Log error
    console.error(err)

    // Reply with error
    res.statusCode = 400
    return res.end('Something went wrong.')
  }

  // Reply with success
  return res.end('Parsing form succeded.')
})

// Start server
server.listen(3000, () => {
  console.log('Listening on port 3000...')
})
```

# API

## `parser(req, callback)`
The `parser()` function is a top-level function exported by the `form-parser` module.

* `req` HTTP request object.
* `callback(field => {})` An Async function, that's called for each new form field found. Passes `field` as argument.

`field` Is an object containing the following keys:
  * `fieldType` The field type (one of 'text' or 'file').
  * `fieldName` The field name.
  * `fieldContent` The field content.
    * If `fieldType` is 'text', `fieldContent` will contain the field text value.
    * If `fieldType` is 'file', `fieldContent` will contain an object with the following keys:
      * `fileName` The name of the file.
      * `fileType` The mime type of the file.
      * `fileStream` The file stream (ReadableStream).