import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

/**
 * Fetches data from the /files/data endpoint.
 * @returns {Promise<Array<Object>>} A promise that resolves to the files data.
 */
export const fetchFilesData = async (fileName = null) => {
  try {
    let url = '/files/data';
    if (fileName) {
      url += `?fileName=${encodeURIComponent(fileName)}`;
    }
    const response = await apiClient.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching files data:', error);
    throw error;
  }
};


/**
 * Fetches the list of available files from the API.
 * @returns {Promise<Array<string>>} A promise that resolves to an array of file names.
 */
export const fetchAvailableFilesList = async () => {
  try {
    const response = await apiClient.get('/files/list');
    return response.data.files || [];
  } catch (error) {
    console.error('Error fetching available files list:', error);
    throw error;
  }
};