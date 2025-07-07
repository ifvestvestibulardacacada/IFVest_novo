// Configuração do multer
// const multer = require('multer');
// const path = require('path');

// const storage = multer.diskStorage({
//     destination: function(req, file, cb) {
//         cb(null, path.join(__dirname, '..', 'uploads'));
//     },
//     filename: function(req, file, cb) {
//         const filename = `${Date.now()}-${file.originalname}`;
//         cb(null, filename);
//     }
// });

// const upload = multer({ storage: storage, array: true} );

// module.exports = upload;
// middlewares/upload.js

const multer = require('multer');
const { storage } = require('../utils/cloudinary'); // Importando o storage configurado com Cloudinary

const upload = multer({ storage });

module.exports = upload;
