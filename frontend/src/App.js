import React, { useState, useEffect, useCallback } from 'react';
import { Container, Spinner, Alert } from 'react-bootstrap';
import AppNavbar from './components/AppNavbar';
import FilesTable from './components/FilesTable';
import { fetchFilesData, fetchAvailableFilesList } from './services/apiClient'; 

function App() {
  const [filesData, setFilesData] = useState([]);
  const [allFilesData, setAllFilesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [availableFiles, setAvailableFiles] = useState([]);
  const [currentFileFilter, setCurrentFileFilter] = useState('');


  const loadData = useCallback(async (fileNameFilter = null) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchFilesData(fileNameFilter);
      setFilesData(data);
      if (!fileNameFilter) {
        setAllFilesData(data);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch data. Ensure the API is running and accessible.');
      setFilesData([]);
      setAllFilesData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    fetchAvailableFilesList().then(setAvailableFiles).catch(console.error);
  }, [loadData]);

  const handleRefresh = () => {
    setCurrentFileFilter('');
    setSearchTerm('');
    loadData();
    fetchAvailableFilesList().then(setAvailableFiles).catch(console.error);
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    if (!currentFileFilter) {
      if (!term) {
        setFilesData(allFilesData);
        return;
      }
      const filtered = allFilesData.map(file => {
        const filteredLines = file.lines.filter(line =>
          Object.values(line).some(value =>
            String(value).toLowerCase().includes(term.toLowerCase())
          )
        );
        return { ...file, lines: filteredLines };
      }).filter(file => file.lines.length > 0);
      setFilesData(filtered);
    }
  };


  const handleFileFilterChange = (fileName) => {
    setCurrentFileFilter(fileName);
    setSearchTerm('');
    if (fileName) {
      loadData(fileName);
    } else {
      loadData();
    }
  };


  return (
    <>
      <AppNavbar
        onSearch={handleSearch}
        onRefresh={handleRefresh}
        availableFiles={availableFiles}
        onFileFilterChange={handleFileFilterChange}
        currentFilter={currentFileFilter}
      />
      <Container>
        {loading && (
          <div className="text-center mt-5">
            <Spinner animation="border" role="status" variant="danger">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
            <p>Loading data...</p>
          </div>
        )}
        {error && <Alert variant="danger" className="mt-3 alert-custom-width">Error: {error}</Alert>}
        {!loading && !error && (
          <FilesTable filesData={filesData} searchTerm={searchTerm} />
        )}
      </Container>
    </>
  );
}

export default App;