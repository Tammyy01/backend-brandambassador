import { Response } from 'express';

interface SuccessResponse {
  success: true;
  message: string;
  data?: any;
  timestamp: string;
}

interface ErrorResponse {
  success: false;
  message: string;
  error: string;
  timestamp: string;
  errors?: any[];
}

export const sendSuccessResponse = (
  res: Response, 
  message: string, 
  data: any = null, 
  statusCode: number = 200
): Response => {
  const response: SuccessResponse = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };
  return res.status(statusCode).json(response);
};

export const sendCreatedResponse = (
  res: Response,
  message: string,
  data: any = null
): Response => {
  return sendSuccessResponse(res, message, data, 201);
};

export const sendBadRequestResponse = (
  res: Response, 
  message: string
): Response => {
  const response: ErrorResponse = {
    success: false,
    message,
    error: 'Bad Request',
    timestamp: new Date().toISOString()
  };
  return res.status(400).json(response);
};

export const sendUnauthorizedResponse = (
  res: Response, 
  message: string = 'Unauthorized'
): Response => {
  const response: ErrorResponse = {
    success: false,
    message,
    error: 'Unauthorized',
    timestamp: new Date().toISOString()
  };
  return res.status(401).json(response);
};

export const sendForbiddenResponse = (
  res: Response, 
  message: string = 'Forbidden'
): Response => {
  const response: ErrorResponse = {
    success: false,
    message,
    error: 'Forbidden',
    timestamp: new Date().toISOString()
  };
  return res.status(403).json(response);
};

export const sendNotFoundResponse = (
  res: Response, 
  message: string = 'Resource not found'
): Response => {
  const response: ErrorResponse = {
    success: false,
    message,
    error: 'Not Found',
    timestamp: new Date().toISOString()
  };
  return res.status(404).json(response);
};

export const sendServerErrorResponse = (
  res: Response, 
  message: string = 'Internal server error'
): Response => {
  const response: ErrorResponse = {
    success: false,
    message,
    error: 'Internal Server Error',
    timestamp: new Date().toISOString()
  };
  return res.status(500).json(response);
};

export const sendValidationErrorResponse = (
  res: Response, 
  errors: any[]
): Response => {
  const response: ErrorResponse = {
    success: false,
    message: 'Validation failed',
    error: 'Validation Error',
    errors,
    timestamp: new Date().toISOString()
  };
  return res.status(422).json(response);
};