import { Router } from 'express';
import {
  getAvailableServices,
  getServiceCatalog,
  createCustomerRequest,
  getCustomerRequests,
  getCustomerRequestById,
  submitCustomerFeedback,
  cancelCustomerRequest,
} from '../controllers/customerPortalController';
import { handleVoiceUpload, transcribeCustomerVoice } from '../controllers/voiceController';
import { optionalAuthenticate, authenticate } from '../middleware/auth';

const router = Router();

// Public / Location-based Service Discovery
router.post('/services/available', optionalAuthenticate, getAvailableServices);
router.get('/services/:serviceType', optionalAuthenticate, getServiceCatalog);

// Customer Voice Complaint Transcription (guest & authenticated)
router.post('/voice/transcribe', optionalAuthenticate, handleVoiceUpload, transcribeCustomerVoice);

// Customer Service Request creation (allows guest submission with contact or authenticated customer)
router.post('/requests', optionalAuthenticate, createCustomerRequest);

// Authenticated Customer Actions
router.get('/requests', authenticate, getCustomerRequests);
router.get('/requests/:id', optionalAuthenticate, getCustomerRequestById);
router.post('/requests/:id/cancel', optionalAuthenticate, cancelCustomerRequest);
router.post('/requests/:id/feedback', optionalAuthenticate, submitCustomerFeedback);

export default router;
