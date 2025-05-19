import React from 'react';
import { Table, Alert } from 'react-bootstrap';

function FilesTable({ filesData, searchTerm }) {
  if (!filesData || filesData.length === 0) {
    return <Alert variant="info" className="mt-3 alert-custom-width">No data available to display. Try refreshing.</Alert>;
  }

  const filteredData = filesData.map(file => {
    const filteredLines = file.lines.filter(line =>
      Object.values(line).some(value =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    return { ...file, lines: filteredLines };
  }).filter(file => file.lines.length > 0);

  if (filteredData.length === 0 && searchTerm) {
     return <Alert variant="warning" className="mt-3 alert-custom-width">No results found for "{searchTerm}".</Alert>;
  }


  return (
    <div className="table-responsive">
      <Table striped bordered hover variant="dark" className="mt-3">
        <thead>
          <tr>
            <th>File Name</th>
            <th>Text</th>
            <th>Number</th>
            <th>Hex</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((fileItem) =>
            fileItem.lines.map((line, index) => (
              <tr key={`${fileItem.file}-${index}`}>
                {index === 0 ? (
                  <td rowSpan={fileItem.lines.length} style={{ verticalAlign: 'middle' }}>
                    {fileItem.file}
                  </td>
                ) : null}
                <td>{line.text}</td>
                <td>{line.number}</td>
                <td>{line.hex}</td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </div>
  );
}

export default FilesTable;