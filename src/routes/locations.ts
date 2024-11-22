import express, { RequestHandler } from 'express';
import { supabase } from '../config/supabase';
import { v4 as uuidv4 } from 'uuid';
import { PostgrestError } from '@supabase/supabase-js';

const router = express.Router();

interface BookingRequest {
  luggageType: string;
  duration: string;
}

interface ServerError {
  message: string;
}

// Test route
const testRoute: RequestHandler = async (_req, res): Promise<void> => {
  res.json({ message: 'API is working' });
};

// Get all storage locations
const getLocationsRoute: RequestHandler = async (_req, res): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('storage_locations')
      .select('*');

    if (error) {
      console.error('Supabase error:', error);
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(200).json({
      message: 'Locations fetched successfully',
      data: data || []
    });
  } catch (error: unknown) {
    console.error('Server error:', error);
    const serverError = error as ServerError;
    res.status(500).json({ 
      error: 'Internal server error',
      details: serverError.message 
    });
  }
};

// Create a booking
const bookRoute: RequestHandler = async (req, res): Promise<void> => {
  try {
    const { luggageType, duration } = req.body as BookingRequest;
    
    if (!luggageType || !duration) {
      res.status(400).json({ 
        error: 'Missing required fields: luggageType and duration are required' 
      });
      return;
    }

    // First, create a user with required fields
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([{ 
        name: 'Test User',
        email: `user_${Date.now()}@example.com`, // Unique email
        phone: '+91' + Math.floor(Math.random() * 9000000000 + 1000000000) // Random phone number
      }])
      .select()
      .single();

    if (userError) {
      console.error('User creation error:', userError);
      res.status(500).json({ error: userError.message });
      return;
    }

    // Get an existing location instead of creating new one
    const { data: locationData, error: locationError } = await supabase
      .from('storage_locations')
      .select('*')
      .limit(1)
      .single();

    if (locationError || !locationData) {
      console.error('Location fetch error:', locationError);
      res.status(500).json({ error: locationError?.message || 'No locations available' });
      return;
    }

    // Create the booking with existing location
    const result = await supabase
      .from('bookings')
      .insert([{
        user_id: userData.id,
        location_id: locationData.id,
        luggage_type: luggageType,
        duration: duration,
        status: 'pending',
        created_at: new Date().toISOString()
      }])
      .select();

    if (result.error) {
      console.error('Booking creation error:', result.error);
      res.status(500).json({ error: result.error.message });
      return;
    }

    res.status(200).json({
      message: 'Booking created successfully',
      data: result.data,
      bookingDetails: {
        userId: userData.id,
        locationId: locationData.id,
        luggageType,
        duration,
        status: 'pending'
      }
    });

  } catch (error: unknown) {
    console.error('Server error:', error);
    const serverError = error as ServerError;
    res.status(500).json({ 
      error: 'Internal server error',
      details: serverError.message 
    });
  }
};

// Get booking status
const getBookingStatusRoute: RequestHandler = async (req, res): Promise<void> => {
  try {
    const { bookingId } = req.params;

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        users (*),
        storage_locations (*)
      `)
      .eq('id', bookingId)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      res.status(500).json({ error: error.message });
      return;
    }

    if (!data) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    res.status(200).json({
      message: 'Booking status fetched successfully',
      data: data
    });
  } catch (error: unknown) {
    console.error('Server error:', error);
    const serverError = error as ServerError;
    res.status(500).json({ 
      error: 'Internal server error',
      details: serverError.message 
    });
  }
};

// Mount routes
router.get('/test', testRoute);
router.get('/locations', getLocationsRoute);
router.post('/book', bookRoute);
router.get('/booking/:bookingId/status', getBookingStatusRoute);

export default router;