// Configure multer for document uploads
import multer from 'multer';


const documentStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/documents/'); // Directory for document uploads
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname); // Unique filename
    }
  });
  
  // Create a multer instance for document uploads
  export const uploadDocument = multer({ storage: documentStorage });


  const eventStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/events/'); // Directory for event uploads
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname); // Unique filename
    }
  });
  
  // Create a multer instance for event uploads
  export const uploadevent = multer({ storage: eventStorage });