const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  uploadContract,
  getContracts,
  getContract,
  deleteContract,
  getStats,
} = require('../controllers/contractController');
const { compareContractsHandler } = require('../controllers/compareController');

// Stats must come before /:id to avoid route conflict
router.get('/stats', protect, getStats);
router.post('/compare', protect, compareContractsHandler);

router.post('/upload', protect, upload.single('contract'), uploadContract);
router.get('/', protect, getContracts);
router.get('/:id', protect, getContract);
router.delete('/:id', protect, deleteContract);

module.exports = router;
