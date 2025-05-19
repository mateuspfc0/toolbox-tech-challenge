const { listFiles, downloadFileContent } = require('../services/externalApi.service');
const { parse } = require('csv-parse');

/**
 * Processes CSV content string into an array of line objects.
 * Malformed lines are skipped.
 * @param {string} csvContent - The CSV content as a string.
 * @param {string} fileName - The name of the file being processed.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of formatted line objects.
 */
async function processCsvContent(csvContent, fileName) {
  console.debug(`[${fileName}] Starting processCsvContent.`); // Log inicial
  return new Promise((resolve, reject) => {
    if (!csvContent || typeof csvContent !== 'string' || csvContent.trim() === '') {
      console.debug(`[${fileName}] File is empty or content is invalid. Resolving with empty lines.`);
      resolve([]);
      return;
    }

    const lines = [];
    const parser = parse(csvContent, {
      columns: ['file_csv', 'text', 'number', 'hex'],
      from_line: 2, // Skip the header line
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    });

    let lineNumber = 1;

    parser.on('readable', () => {
      let record;
      while ((record = parser.read()) !== null) {
        console.debug(`\n[${fileName}] Readable: Record for data line ${lineNumber}:`, JSON.stringify(record));

        const fileFromCsv = record.file_csv;
        const textValue = record.text;
        const numberString = record.number;
        const hexValue = record.hex;
        let isValidRecord = true;

        if (!fileFromCsv || typeof fileFromCsv !== 'string' || fileFromCsv.trim() === '') {
          console.debug(`[${fileName}] Data line ${lineNumber}: FAIL - Invalid or empty 'file_csv' field: '${fileFromCsv}' (type: ${typeof fileFromCsv})`);
          isValidRecord = false;
        }
        if (!textValue || typeof textValue !== 'string' || textValue.trim() === '') {
          console.debug(`[${fileName}] Data line ${lineNumber}: FAIL - Invalid or empty 'text' field: '${textValue}' (type: ${typeof textValue})`);
          isValidRecord = false;
        }
        if (!numberString || typeof numberString !== 'string' || numberString.trim() === '') {
          console.debug(`[${fileName}] Data line ${lineNumber}: FAIL - Invalid or empty 'number' string: '${numberString}' (type: ${typeof numberString})`);
          isValidRecord = false;
        }
        if (!hexValue || typeof hexValue !== 'string' || hexValue.trim() === '') {
          console.debug(`[${fileName}] Data line ${lineNumber}: FAIL - Invalid or empty 'hex' field: '${hexValue}' (type: ${typeof hexValue})`);
          isValidRecord = false;
        }

        if (!isValidRecord) {
          console.debug(`[${fileName}] Data line ${lineNumber}: Record failed initial field validation. Skipping.`);
          lineNumber++;
          continue;
        }
        console.debug(`[${fileName}] Data line ${lineNumber}: PASS - Initial field validation.`);

        const numberValueParsed = parseInt(numberString, 10);
        if (isNaN(numberValueParsed)) {
          console.debug(`[${fileName}] Data line ${lineNumber}: FAIL - 'number' field '${numberString}' is not a valid number. Skipping.`);
          lineNumber++;
          continue;
        }
        console.debug(`[${fileName}] Data line ${lineNumber}: PASS - 'number' field '${numberString}' parsed to ${numberValueParsed}.`);

        if (!/^[a-fA-F0-9]{32}$/.test(hexValue)) {
          console.debug(`[${fileName}] Data line ${lineNumber}: FAIL - 'hex' field '${hexValue}' is not a 32-char hex. Skipping.`);
          lineNumber++;
          continue;
        }
        console.debug(`[${fileName}] Data line ${lineNumber}: PASS - 'hex' field '${hexValue}' is valid.`);
        
        console.debug(`[${fileName}] Data line ${lineNumber}: Record is valid. Adding to lines array.`);
        lines.push({
          text: textValue.trim(),
          number: numberValueParsed,
          hex: hexValue.trim(),
        });
        lineNumber++;
      }
    });

    parser.on('error', (err) => {
      console.error(`[${fileName}] Critical error parsing CSV stream:`, err.message);
      reject(err);
    });

    parser.on('end', () => {
      console.debug(`[${fileName}] CSV stream ended. Found ${lines.length} valid lines. Resolving promise.`);
      resolve(lines);
    });
  });
}


/**
 * Handles the GET /files/data request.
 * Fetches files from external API, processes them, and returns formatted data.
 * Supports optional ?fileName query parameter.
 */
async function getFilesData(req, res) {
  try {
    const { fileName: fileNameQuery } = req.query;
    let fileNamesToProcess;

    if (fileNameQuery) {
      fileNamesToProcess = [fileNameQuery];
    } else {
      fileNamesToProcess = await listFiles();
    }

    if (!fileNamesToProcess || fileNamesToProcess.length === 0) {
      return res.status(200).json([]);
    }

    const results = [];
    const fileProcessingPromises = fileNamesToProcess.map(async (fileName) => {
      try {
        const csvContent = await downloadFileContent(fileName);
        if (csvContent === null) {
          return null; 
        }
        const lines = await processCsvContent(csvContent, fileName);
        if (lines.length > 0) {
          return { file: fileName, lines: lines };
        }
        return null; 
      } catch (error) {
        console.error(`API: Critical error processing file ${fileName}:`, error.message);
        return null;
      }
    });

    const settledResults = await Promise.allSettled(fileProcessingPromises);
    settledResults.forEach(result => {
      if (result.status === 'fulfilled' && result.value) {
        results.push(result.value);
      } else if (result.status === 'rejected') {
        console.error('API: A file processing promise was unexpectedly rejected:', result.reason);
      }
    });
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(results);
  } catch (error) {
    console.error('API: General error in getFilesData controller:', error.message, error.stack);
    res.status(500).json({ message: 'Error processing files data', error: error.message });
  }
}

module.exports = {
  getFilesData,
  processCsvContent
};
