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
import { optionalAuthenticate, authenticate } from '../middleware/auth';

const router = Router();

// Public / Location-based Service Discovery
router.post('/services/available', optionalAuthenticate, getAvailableServices);
router.get('/services/:serviceType', optionalAuthenticate, getServiceCatalog);

// Customer Service Request creation (allows guest submission with contact or authenticated customer)
router.post('/requests', optionalAuthenticate, createCustomerRequest);

// Customer Service Requests (authenticated customer or guest with tracked ticket IDs)
router.get('/requests', optionalAuthenticate, getCustomerRequests);
router.get('/requests/:id', optionalAuthenticate, getCustomerRequestById);
router.post('/requests/:id/cancel', optionalAuthenticate, cancelCustomerRequest);
router.post('/requests/:id/feedback', optionalAuthenticate, submitCustomerFeedback);

export default router;
