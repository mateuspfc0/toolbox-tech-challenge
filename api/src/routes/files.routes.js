const express = require('express');
const { getFilesData } = require('../controllers/files.controller');
const { listFiles } = require('../services/externalApi.service');

const router = express.Router();

router.get('/data', getFilesData);

router.get('/list', async (req, res) => {
    try {
      const fileNames = await listFiles();
      res.status(200).json({ files: fileNames });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching file list', error: error.message });
    }
  });

module.exports = router;