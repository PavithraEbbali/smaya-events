export type Testimonial = {
  /** The review as the client wrote it. One entry per paragraph. */
  text: string[]
  author: string
  role: string
}

/**
 * Real reviews from real clients, quoted verbatim.
 *
 * This file is the single source for both the Home teaser and /testimonials —
 * nothing in here is filler copy, so only add an entry when a client has
 * actually sent us one.
 */
export const testimonials: Testimonial[] = [
  {
    text: [
      'We entrusted Smaya Events with our Sangeeth, and they made it an unforgettable celebration. From the choreography and energetic MC hosting to the DJ, dance performances, and complete event coordination, everything was handled with great professionalism.',
      'The team kept our guests engaged throughout the evening, and every performance was beautifully organized. We truly enjoyed the event without having to worry about a single detail.',
      'Thank you, Smaya Events, for making our family’s special day so memorable. Highly recommended!',
    ],
    author: 'Vijayakumar',
    role: 'Sangeeth · Hesaraghatta',
  },
  {
    text: [
      'We contacted Smaya Events at the last minute for our Sangeeth, and they pulled everything together beautifully. From arranging an amazing MC and talented dancers to keeping the entire evening lively, everything was managed seamlessly.',
      'The best part was how they got everyone—from kids to elders—on the dance floor and made the celebration so much fun. They truly made our special day memorable.',
      'A big thank you to Smaya Events for the wonderful experience!',
    ],
    author: 'Kaushik',
    role: 'Sangeeth · Srinagar',
  },
  {
    text: [
      'I chose Smaya Events for my baby shower, and it was one of the best decisions we made. The team beautifully arranged the decoration, hall, and every little detail, making the celebration completely stress-free for our family.',
      'What made it even more special was how Manasa personally took care of everything and even got me, the mom-to-be, to dance and truly enjoy my own celebration. It was filled with joy, laughter, and wonderful memories.',
      'Thank you, Smaya Events, for making my baby shower so beautiful and unforgettable!',
    ],
    author: 'Usha Rani',
    role: 'Baby Shower · Bangalore',
  },
  {
    text: [
      'We celebrated our daughter’s 5th birthday with Smaya Events, and everything was taken care of so well. From the decorations and entertainment to coordinating the entire event, the team made sure the day went smoothly.',
      'The kids had an amazing time, and even the adults enjoyed themselves. What I appreciated most was that I could relax and enjoy my daughter’s special day without worrying about the arrangements.',
      'A special thanks to Manasa for personally being there and making sure everything was perfect. It was a beautiful celebration, and we have so many lovely memories from the day.',
    ],
    author: 'Mallika Karanth',
    role: 'Birthday Celebration',
  },
]
