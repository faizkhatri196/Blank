import { Request, Response } from 'express';
import { realWebEvaluationService } from '../services/realWebEvaluationService';
import { EvaluationCase } from '../models/EvaluationCase';
import { ServoraEvaluationRun } from '../models/ServoraEvaluationRun';

export const getEvaluationCases = async (req: Request, res: Response): Promise<void> => {
  try {
    const cases = await realWebEvaluationService.ensureCasesSeeded();
    res.json({
      success: true,
      data: cases,
      meta: {
        total: cases.length,
        dataType: 'PUBLIC_WEB',
        auditStandard: 'Ahmedabad / Gujarat Real-Web Technical Validation',
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const triggerEvaluationRun = async (req: Request, res: Response): Promise<void> => {
  try {
    const version = (req.body.version as 'v1' | 'v2') || 'v2';
    const summary = await realWebEvaluationService.runFullValidation(version);
    res.json({
      success: true,
      data: summary,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getEvaluationRuns = async (req: Request, res: Response): Promise<void> => {
  try {
    const runs = await ServoraEvaluationRun.find()
      .populate('evaluationCaseId')
      .sort({ createdAt: -1 });
    res.json({
      success: true,
      data: runs,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getEvaluationSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const history = await realWebEvaluationService.getEvaluationHistory();
    res.json({
      success: true,
      data: history,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
