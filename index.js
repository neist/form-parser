// Import busboy
const Busboy = require('busboy')

// Default export
module.exports = (req, callback) =>
  // Return promise
  new Promise((resolve, reject) => {
    // Keep track of pending fields
    let pending = 0

    // Finished state
    let finished = false

    // Prepare parser
    const parser = new Busboy({ headers: req.headers })

    // Error handler
    const errorHandler = err => {
      // Stop streaming the request
      req.unpipe(parser)

      // Remove all listeners
      parser.removeAllListeners()

      // Reject with error
      return reject(err)
    }

    // Handle files
    parser.on('file', async (fieldName, fileStream, fileName, encoding, fileType) => {
        // Increase pending fields
        pending += 1

        // Prepare field type
        const fieldType = 'file'

        // Prepare field
        const field = {
          fieldType,
          fieldName,
          fieldContent: {
            fileName,
            fileType,
            fileStream
          }
        }

        // Callback
        await callback(field).catch(errorHandler)

        // Make sure we proceed
        fileStream.resume()

        // Decrease pending fields
        pending -= 1

        // Are we finished with all fields?
        if (finished && pending === 0) {
          resolve()
        }
      }
    )

    // Handle fields
    parser.on('field', async (fieldName, fieldContent) => {
      // Increase pending fields
      pending += 1
      
      // Prepare field type
      const fieldType = 'text'

      // Prepare field
      const field = {
        fieldType,
        fieldName,
        fieldContent
      }

      // Callback
      await callback(field).catch(errorHandler)

      // Decrease pending fields
      pending -= 1

      // Are we finished with all fields?
      if (finished && pending === 0) {
        resolve()
      }
    })

    // Handle 'error' event
    parser.on('error', reject)

    // Handle 'finish' event
    parser.on('finish', () => {
      // Parsing has finished
      finished = true

      // Should we resolve?
      pending === 0 && resolve()
    })

    // Start parsing request
    req.pipe(parser)
  })
