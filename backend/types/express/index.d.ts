import 'express';

declare global {
  namespace Express {
    interface Request {
      token?: string;
      user?: {
        id: string;
        username: string;
        name: string;
        email: string;
      };
    }
  }
}

export {}; 
