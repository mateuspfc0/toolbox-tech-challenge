import React from 'react';
import { Navbar, Container, Form, Button } from 'react-bootstrap';

function AppNavbar({ onSearch, onRefresh, availableFiles, onFileFilterChange, currentFilter }) {
  return (
    <Navbar bg="danger" variant="dark" expand="lg" className="mb-4">
      <Container>
        <Navbar.Brand href="#">Toolbox React Test</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav" className="justify-content-end">
          <Form className="d-flex me-2">
            <Form.Control
              type="search"
              placeholder="Search in table (client-side)"
              className="me-2"
              aria-label="Search"
              onChange={(e) => onSearch(e.target.value)}
            />
          </Form>
          {availableFiles && availableFiles.length > 0 && (
            <Form.Select
              aria-label="Filter by file name"
              className="me-2"
              style={{ maxWidth: '200px' }}
              onChange={(e) => onFileFilterChange(e.target.value)}
              value={currentFilter || ""}
            >
              <option value="">All Files</option>
              {availableFiles.map(file => (
                <option key={file} value={file}>{file}</option>
              ))}
            </Form.Select>
          )}
          <Button variant="outline-light" onClick={onRefresh}>Refresh Data</Button>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default AppNavbar;