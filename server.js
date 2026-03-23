// Fixed : Error: querySrv ECONNREFUSED _mongodb._tcp.vacqcluster.cwrmhjl.mongodb.net
const { setServers } = require("node:dns/promises");
setServers(["1.1.1.1", "8.8.8.8"]);

// Import
const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db.js');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('@exortek/express-mongo-sanitize');
const helmet = require('helmet');
const {xss} = require('express-xss-sanitizer');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const cors = require('cors');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUI = require('swagger-ui-express');

// Load env vars 
dotenv.config({path:'./config/config.env'});

// Routes files 
const campgrounds = require('./routes/campgrounds');
const auth = require('./routes/auth');
const bookings = require('./routes/bookings');

const app = express();

// Connect to database
connectDB();

// Query parser
app.set('query parser', 'extended');

// Body parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// Sanitize Data
app.use(mongoSanitize());

// Set secure header
app.use(helmet());

// Prevent XSS attacks
app.use(xss());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 mins
  max: 1000
});

app.use(limiter);

// Prevent http param pollutions
app.use(hpp());

// Enable CORS
app.use(cors());

const PORT = process.env.PORT || 5000;

const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Library API',
      version: '1.0.0',
      description: 'A simple Express Campground Booking API'
    },
    servers: [
      {
        url: process.env.HOST + ':' + PORT + '/api/v1'
      }
    ],
  },
  apis: ['./routes/*.js']
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocs));

// Mount Routes
app.use('/api/v1/campgrounds', campgrounds);
app.use('/api/v1/auth', auth);
app.use('/api/v1/bookings', bookings);

const server = app.listen(PORT, 
  console.log('Server running in ', process.env.NODE_ENV, "on " + process.env.HOST)
);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);

  // Close server & exit process
  server.close(() => process.exit(1));
});