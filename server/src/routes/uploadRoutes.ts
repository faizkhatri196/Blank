import { Router, Request, Response, NextFunction } from 'express';
import { upload } from '../middleware/upload';
import { optionalAuthenticate } from '../middleware/auth';

const router = Router();

// Multi-file & single-file upload middleware with error trapping
const handleUpload = (req: Request, res: Response, next: NextFunction): void => {
  upload.fields([
    { name: 'photo', maxCount: 10 },
    { name: 'photos', maxCount: 10 },
  ])(req, res, (err: any) => {
    if (err) {
      const isSizeError = err.code === 'LIMIT_FILE_SIZE' || err.message?.includes('File too large');
      res.status(400).json({
        success: false,
        error: {
          code: isSizeError ? 'FILE_TOO_LARGE' : 'UPLOAD_ERROR',
          message: isSizeError
            ? 'One or more image files exceed the 5 MB limit. Please upload smaller photos.'
            : err.message || 'File upload failed',
        },
      });
      return;
    }
    next();
  });
};

router.post(
  '/',
  optionalAuthenticate,
  handleUpload,
  (req: Request, res: Response): void => {
    // Gather all uploaded files across 'photo' and 'photos' fields
    const reqFiles = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const files: Express.Multer.File[] = [];

    if (reqFiles) {
      if (Array.isArray(reqFiles.photo)) files.push(...reqFiles.photo);
      if (Array.isArray(reqFiles.photos)) files.push(...reqFiles.photos);
    }
    if ((req as any).file) {
      files.push((req as any).file);
    }

    if (files.length === 0) {
      res.status(400).json({
        success: false,
        error: { code: 'NO_FILE', message: 'No image file uploaded' },
      });
      return;
    }

    const fileRecords = files.map((file) => ({
      filename: file.filename,
      url: `/uploads/${file.filename}`,
      size: file.size,
      mimetype: file.mimetype,
    }));

    const urls = fileRecords.map((f) => f.url);

    res.json({
      success: true,
      data: {
        filename: fileRecords[0].filename,
        url: fileRecords[0].url, // Backwards-compatible single URL
        urls,                     // Multi-photo array of URLs
        count: fileRecords.length,
        files: fileRecords,
      },
    });
  }
);

export default router;
