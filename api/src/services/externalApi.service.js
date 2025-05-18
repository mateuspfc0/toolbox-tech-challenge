const axios = require('axios');

const EXTERNAL_API_BASE_URL = 'https://echo-serv.tbxnet.com/v1';
const API_KEY = 'Bearer aSuperSecretKey'; // La API Key proporcionada

const apiClient = axios.create({
  baseURL: EXTERNAL_API_BASE_URL,
  headers: {
    'Authorization': API_KEY
  }
});

/**
 * Fetches the list of available files from the external API.
 * @returns {Promise<Array<string>>} A promise that resolves to an array of file names.
 */
async function listFiles() {
  try {
    const response = await apiClient.get('/secret/files');
    return response.data.files || [];
  } catch (error) {
    console.error('Error fetching file list:', error.message);
    // Podrías decidir si lanzar el error o devolver un array vacío/manejarlo de otra forma
    throw new Error(`Failed to fetch file list: ${error.message}`);
  }
}

/**
 * Fetches the content of a specific file from the external API.
 * @param {string} fileName - The name of the file to download.
 * @returns {Promise<string|null>} A promise that resolves to the file content (CSV string) or null if an error occurs.
 */
async function downloadFileContent(fileName) {
  if (!fileName || typeof fileName !== 'string' || fileName.trim() === '') {
    console.error('Invalid file name provided for download:', fileName);
    return null;
  }
  try {
    const response = await apiClient.get(`/secret/file/${fileName}`);
    if (typeof response.data === 'string') {
      return response.data;
    } else {
      console.warn(`Unexpected data format for file ${fileName}. Expected string, got:`, typeof response.data);
      return null;
    }
  } catch (error) {
    console.error(`Error downloading file ${fileName}:`, error.message);
    if (error.response) {
      console.error('Error details:', error.response.status, error.response.data);
    }
    return null;
  }
}

module.exports = {
  listFiles,
  downloadFileContent
};