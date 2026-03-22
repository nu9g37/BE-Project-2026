const Booking = require('../models/Booking');
const Campground = require('../models/Campground');

// @desc    Get all bookings
// @routes  GET /api/v1/bookings
// @access  Public
exports.getBookings = async (req, res, next) => {
  let query;

  if (req.user.role !== 'admin') {
    query = Booking.find({ user: req.user.id }).populate({
      path: 'campground',
      select: 'name province tel'
    }).populate('user', 'name');
  } else {
    if (req.params.campgroundId) {
      query = Booking.find({ campground: req.params.campgroundId }).populate({
        path: 'campground',
        select: 'name province tel'
      }).populate('user', 'name');
    } else {
      query = Booking.find().populate({
        path: 'campground',
        select: 'name province tel'
      }).populate('user', 'name');
    }
  }

  try {
    const bookings = await query;

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      msg: "Cannot find Booking"
    });
  }
};

// @desc    Get single booking
// @routes  GET /api/v1/bookings/:id
// @access  Public
exports.getBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate({
      path: 'campground',
      select: 'name description tel'
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        msg: `No booking with the id of ${req.params.id}`
      });
    }

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      msg: 'Cannot find Booking'
    });
  }
};

// @desc    Add a booking
// @routes  POST /api/v1/campgrounds/:campgroundId/bookings
// @access  Private
exports.addBooking = async (req, res, next) => {
  try {
    req.body.campground = req.params.campgroundId;

    const campground = await Campground.findById(req.params.campgroundId);

    if (!campground) {
      return res.status(404).json({
        success: false,
        msg: `No campground with the id of ${req.params.campgroundId}`
      });
    }

    req.body.user = req.user.id;

    const existedBookings = await Booking.find({ user: req.user.id });

    // User is not admin, can only create 3 bookings
    if (existedBookings.length >= 3 && req.user.role !== 'admin') {
      return res.status(400).json({
        success: false,
        msg: `The user with ID ${req.user.id} has already made 3 bookings`
      });
    }

    const booking = await Booking.create(req.body);

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      msg: 'Cannot create Booking'
    });
  }
};

// @desc    Update a booking
// @routes  PUT /api/v1/bookings/:id
// @access  Private
exports.updateBooking = async (req, res, next) => {
  try {
    let booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        msg: `No booking with the id of ${req.params.id}`
      });
    }

    // Make sure user is the booking owner
    if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        msg: `User ${req.user.id} is not authorized to update this booking`
      });
    }

    booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      msg: 'Cannot update Booking'
    });
  }
};

// @desc    Delete a booking
// @routes  DELETE /api/v1/bookings/:id
// @access  Private
exports.deleteBooking = async (req, res, next) => {
  try {
    let booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        msg: `No booking with the id of ${req.params.id}`
      });
    }

    // Make sure user is the booking owner
    if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        msg: `User ${req.user.id} is not authorized to delete this booking`
      });
    }

    await booking.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      msg: 'Cannot delete Booking'
    });
  }
};