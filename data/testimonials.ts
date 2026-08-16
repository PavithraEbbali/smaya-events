export type Testimonial = {
  text: string
  author: string
  role: string
}

export const testimonials: Testimonial[] = [
  {
    text: 'Smaya Events made our wedding magical and stress-free. Every detail was handled beautifully, allowing us to truly enjoy our special day.',
    author: 'Neha & Rahul',
    role: 'Wedding Clients',
  },
  {
    text: 'Our Sangeeth choreography was the highlight of the celebration. Manasa is incredibly talented and brought so much energy to our family!',
    author: 'Priya S.',
    role: 'Sangeeth Client',
  },
  {
    text: 'Professional, creative, and highly organized. They elevated our corporate gala beyond expectations with stunning decor and flawless execution.',
    author: 'Amit Verma',
    role: 'CEO, TechFlow',
  },
  {
    text: 'From the traditional Seemantha to our baby shower, Smaya Events understood exactly what we needed and delivered an emotional, beautiful setup.',
    author: 'Kavya & Vikram',
    role: 'Private Clients',
  },
  {
    text: 'A boutique experience with grand execution. Manasa and her team are a powerhouse of creativity and discipline.',
    author: 'The Mehta Family',
    role: 'Wedding Clients',
  },
  {
    text: 'Absolutely phenomenal choreography! Manasa made even the non-dancers in our family look like stars on stage.',
    author: 'Sneha Reddy',
    role: 'Sangeeth Client',
  },
]

/** Three-card teaser for the Home page. */
export const testimonialsPreview = testimonials.slice(0, 3)
