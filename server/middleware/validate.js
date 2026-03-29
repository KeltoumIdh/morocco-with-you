import { z } from 'zod';

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: result.error.flatten().fieldErrors,
    });
  }
  req.body = result.data;
  next();
};

export const registerSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Min 6 characters'),
  full_name: z.string().min(2, 'Name required'),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const bookingSchema = z.object({
  experience_id: z.string().uuid().optional(),
  activity_id: z.string().uuid().optional(),
  package_id: z.string().uuid().optional(),
  booking_type: z
    .enum([
      'experience',
      'activity',
      'accommodation',
      'restaurant',
      'package',
      'group_trip',
    ])
    .default('experience'),
  travel_date: z.string().refine((d) => new Date(d) > new Date(), 'Travel date must be in the future'),
  guests: z.number().int().min(1).max(50),
  special_requests: z.string().max(1000).optional(),
});

export const planningRequestSchema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  start_date: z.string(),
  end_date: z.string().optional(),
  group_size: z.number().int().min(1).max(200),
  group_type: z.enum(['Solo', 'Couple', 'Family', 'Friends', 'Group', 'Corporate']),
  cities: z.array(z.string()).min(1),
  budget_range: z.string(),
  interests: z.array(z.string()).optional(),
  accommodation_type: z.string().optional(),
  special_requests: z.string().max(2000).optional(),
  package_id: z.string().uuid().optional(),
});

const emailOpt = z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? undefined : v),
  z.string().email().optional()
);

export const providerSchema = z.object({
  name: z.string().min(2),
  type: z.enum([
    'ACTIVITY',
    'ACCOMMODATION',
    'RESTAURANT',
    'EXPERIENCE',
    'TRANSPORT',
    'GUIDE',
  ]),
  city: z.string().min(2),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: emailOpt,
  website: z.string().optional(),
  logo_url: z.string().optional(),
  cover_url: z.string().optional(),
  images: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  commission_rate: z.number().min(0).max(100).default(10),
  bank_iban: z.string().optional(),
  bank_name: z.string().optional(),
  tags: z.array(z.string()).optional(),
  verified: z.boolean().optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
});

export const providerServiceSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  price: z.number().min(0),
  price_type: z
    .enum(['per_person', 'per_group', 'per_night', 'per_day', 'free', 'on_request'])
    .default('per_person'),
  duration: z.string().optional(),
  max_capacity: z.number().int().min(1).optional(),
  min_age: z.number().int().min(0).optional(),
  images: z.array(z.string()).optional(),
  is_available: z.boolean().optional(),
});
