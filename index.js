const express = require('express');
const methodOverride = require('method-override');
const session = require('express-session');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const { secure_pass } = require('./middleware/sessionMidleware');
const sessionOptions = require('./utils/sessionConfig');
const cookieParser = require('cookie-parser');
const { usuarios, simulados, inicio, professor, uploads } = require('./routes');
const path = require('path');


const app = express();




app.use(bodyParser.json());

app.use(session(sessionOptions));
app.use(cookieParser());


// app.use(helmet({
//     contentSecurityPolicy: {
//         directives: {
//             defaultSrc: ["'self'"],
//             scriptSrc: [
//                 "'self'",
//                 "'unsafe-inline'",
//                 "'unsafe-eval'",
//                 "https://cdn.jsdelivr.net",
//                 "https://cdnjs.cloudflare.com",
//                 "https://cdn-uicons.flaticon.com",
//                 "https://code.jquery.com",
//                 "https://unpkg.com",
//                 "'self' js/"
//             ],
//             scriptSrcAttr: ["'self'", "'unsafe-inline'"], //
//             styleSrc: [
//                 "'self'",
//                 "'unsafe-inline'",
//                 "https://cdn.jsdelivr.net",
//                 "https://cdnjs.cloudflare.com",
//                 "https://cdn-uicons.flaticon.com",
//                 "https://fonts.googleapis.com"
//             ],
//             fontSrc: [
//                 "'self'",
//                 "https:",
//                 "data:",
//                 "https://fonts.gstatic.com"
//             ],
//             imgSrc: ["'self'", "data:", "https:"],
//             connectSrc: ["'self'"],
//             frameSrc: ["'self'"],
//             objectSrc: ["'none'"],
//             mediaSrc: ["'self'"],
//             workerSrc: ["'self'"],
//             formAction: ["'self'"],
//             frameAncestors: ["'self'"]
//         }
//     },
//     crossOriginEmbedderPolicy: false,
//     crossOriginResourcePolicy: { policy: "cross-origin" }
// }));



app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json())

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.use(methodOverride('_method'));

app.use(async (req, res, next) => {
    res.locals.currentPage = ''
    if (req.method === 'GET') {
        req.session.lastGetUrl = req.originalUrl;
    }
    next();
});

app.use('/', inicio);
app.use(secure_pass);
app.use('/usuario', usuarios);
app.use('/professor', professor);
app.use("/uploads",  uploads) 
app.use("/simulados",  simulados) 

app.listen(process.env.PORT || 3000, () => {
    console.log('Working on port 3000!')
});
 module.exports = {app};
