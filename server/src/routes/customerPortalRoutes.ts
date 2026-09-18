import { Router } from 'express';
import {
  getAvailableServices,
  getServiceCatalog,
  createCustomerRequest,
  getCustomerRequests,
  getCustomerRequestById,
  submitCustomerFeedback,
} from '../controllers/customerPortalController';
import { optionalAuthenticate, authenticate } from '../middleware/auth';

const router = Router();

// Public / Location-based Service Discovery
router.post('/services/available', optionalAuthenticate, getAvailableServices);
router.get('/services/:serviceType', optionalAuthenticate, getServiceCatalog);

// Customer Service Request creation (allows guest submission with contact or authenticated customer)
router.post('/requests', optionalAuthenticate, createCustomerRequest);

// Authenticated Customer Actions
router.get('/requests', authenticate, getCustomerRequests);
router.get('/requests/:id', optionalAuthenticate, getCustomerRequestById);
router.post('/requests/:id/feedback', optionalAuthenticate, submitCustomerFeedback);

export default router;
