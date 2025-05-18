const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../src/app');
const { expect } = chai;

chai.use(chaiHttp);

const nock = require('nock');
const EXTERNAL_API_BASE_URL = 'https://echo-serv.tbxnet.com/v1';

const { processCsvContent } = require('../src/controllers/files.controller');


describe('Files API', () => {
  beforeEach(() => {
    nock.cleanAll();
  });

  describe('GET /files/data', () => {
    it('should return formatted data for valid files', (done) => {
      nock(EXTERNAL_API_BASE_URL)
        .get('/secret/files')
        .reply(200, { files: ['file1.csv', 'file2.csv', 'fileWithError.csv', 'emptyFile.csv'] });

      const file1CsvContent = `file,text,number,hex\nfile1.csv,test text 1,123,a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6\nfile1.csv,another line,456,00112233445566778899aabbccddeeff`;
      nock(EXTERNAL_API_BASE_URL)
        .get('/secret/file/file1.csv')
        .reply(200, file1CsvContent, { 'Content-Type': 'text/csv' });

      const file2CsvContent = `file,text,number,hex\nfile2.csv,valid data,789,ffeeddccbbaa99887766554433221100\nfile2.csv,invalid,number,badhex,toomanyfields\nfile2.csv,onlytext\nfile2.csv,text3,999,11223344556677889900aabbccddeeff`;
      nock(EXTERNAL_API_BASE_URL)
        .get('/secret/file/file2.csv')
        .reply(200, file2CsvContent, { 'Content-Type': 'text/csv' });

      nock(EXTERNAL_API_BASE_URL)
        .get('/secret/file/fileWithError.csv')
        .reply(500, 'Internal Server Error');

      nock(EXTERNAL_API_BASE_URL)
        .get('/secret/file/emptyFile.csv')
        .reply(200, '', { 'Content-Type': 'text/csv' });


      chai.request(app)
        .get('/files/data')
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('array');
          
          expect(res.body.length).to.equal(2);

          const file1Data = res.body.find(f => f.file === 'file1.csv');
          expect(file1Data).to.not.be.undefined;
          expect(file1Data.lines).to.be.an('array').with.lengthOf(2);
          expect(file1Data.lines[0]).to.deep.equal({
            text: 'test text 1',
            number: 123,
            hex: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6'
          });

          const file2Data = res.body.find(f => f.file === 'file2.csv');
          expect(file2Data).to.not.be.undefined;
          expect(file2Data.lines).to.be.an('array');
          expect(file2Data.lines.length).to.equal(2);
          expect(file2Data.lines[0]).to.deep.equal({
            text: 'valid data',
            number: 789,
            hex: 'ffeeddccbbaa99887766554433221100'
          });
           expect(file2Data.lines[1]).to.deep.equal({
            text: 'text3',
            number: 999,
            hex: '11223344556677889900aabbccddeeff'
          });

          done();
        });
    });

    it('should return an empty array if file list is empty', (done) => {
      nock(EXTERNAL_API_BASE_URL)
        .get('/secret/files')
        .reply(200, { files: [] });

      chai.request(app)
        .get('/files/data')
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('array').that.is.empty;
          done();
        });
    });

    it('should return an empty array if all files are invalid or empty', (done) => {
      nock(EXTERNAL_API_BASE_URL)
        .get('/secret/files')
        .reply(200, { files: ['invalid1.csv', 'invalid2.csv'] });

      nock(EXTERNAL_API_BASE_URL)
        .get('/secret/file/invalid1.csv')
        .reply(200, 'file,text,number,hex\ninvalid1.csv,text'); 

      nock(EXTERNAL_API_BASE_URL)
        .get('/secret/file/invalid2.csv')
        .reply(200, ''); 

      chai.request(app)
        .get('/files/data')
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('array').that.is.empty;
          done();
        });
    });


    it('should handle errors when fetching the file list from external API', (done) => {
      nock(EXTERNAL_API_BASE_URL)
        .get('/secret/files')
        .reply(500, 'External API Error');

      chai.request(app)
        .get('/files/data')
        .end((err, res) => {
          expect(res).to.have.status(500);
          expect(res.body).to.have.property('message');
          expect(res.body.message).to.include('Error processing files data');
          done();
        });
    });
  });

  describe('Unit Test: processCsvContent', () => {
    it('should correctly parse valid CSV content', async () => {
      const csv = `file,text,number,hex
file1.csv,Hello World,12345,1234567890abcdef1234567890abcdef
file1.csv,Another Test,67890,fedcba0987654321fedcba0987654321`;
      const lines = await processCsvContent(csv, 'file1.csv');
      expect(lines).to.be.an('array').with.lengthOf(2);
      expect(lines[0]).to.deep.equal({ text: 'Hello World', number: 12345, hex: '1234567890abcdef1234567890abcdef' });
      expect(lines[1]).to.deep.equal({ text: 'Another Test', number: 67890, hex: 'fedcba0987654321fedcba0987654321' });
    });

    it('should return empty array for empty CSV content', async () => {
      const lines = await processCsvContent('', 'empty.csv');
      expect(lines).to.be.an('array').that.is.empty;
    });

    it('should skip lines with incorrect number of fields', async () => {
      const csv = `file,text,number,hex
file2.csv,Valid Line,100,aabbccddeeff00112233445566778899
file2.csv,Not enough fields,200
file2.csv,Too,many,fields,in,this,line,300,00112233445566778899aabbccddeeff`;
      const lines = await processCsvContent(csv, 'file2.csv');
      expect(lines).to.be.an('array').with.lengthOf(1);
      expect(lines[0].text).to.equal('Valid Line');
    });

    it('should skip lines with invalid number format', async () => {
      const csv = `file,text,number,hex
file3.csv,Good,123,112233445566778899aabbccddeeff00
file3.csv,Bad Number,notANumber,aabbccddeeff00112233445566778899`;
      const lines = await processCsvContent(csv, 'file3.csv');
      expect(lines).to.be.an('array').with.lengthOf(1); // Should now pass
      expect(lines[0].number).to.equal(123);
      expect(lines[0].text).to.equal('Good');
      expect(lines[0].hex).to.equal('112233445566778899aabbccddeeff00');
    });

    it('should skip lines with invalid hex format (not 32 chars or invalid chars)', async () => {
      const csv = `file,text,number,hex
file4.csv,Correct,456,abcdef0123456789abcdef0123456789
file4.csv,Short Hex,789,shorthex
file4.csv,Long Hex,101,abcdef0123456789abcdef0123456789extra
file4.csv,Invalid Char Hex,112,abcdef0123456789abcdef012345678g`;
      const lines = await processCsvContent(csv, 'file4.csv');
      expect(lines).to.be.an('array').with.lengthOf(1);
      expect(lines[0].hex).to.equal('abcdef0123456789abcdef0123456789');
    });
  });

  after(() => {
    nock.restore();
  });
});
