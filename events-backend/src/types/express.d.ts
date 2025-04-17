
import { User } from 'users/users.entity';
import { File as MulterFile } from 'multer';

declare namespace Express {
    export interface Request {
        user?: {
            sub: number;
            email: string;
            role: string;
            iat?: number;
            exp?: number;
            // add any other properties that are in your JWT payload
        }
    }
} 


declare global {
    namespace Express {

        interface Request {
            user?: User; // Add the user property with the appropriate type
        }
    interface Multer {
            File: MulterFile;
          }
    }
}
