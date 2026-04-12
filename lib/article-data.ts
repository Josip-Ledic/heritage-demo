export interface PullQuote {
  text: string
  yPosition: number // Percentage of content height (0-1)
  side: 'left' | 'right'
}

export interface Article {
  title: string
  subtitle?: string
  author?: string
  date?: string
  content: string
  pullQuotes: PullQuote[]
}

export const article: Article = {
  title: "Legacy of Innovation",
  subtitle: "Where Heritage Meets the Future of Motorcycling",
  author: "Josip Ledić",
  date: "April 2026",
  content: `In the world of premium motorcycles, few names carry the weight of tradition and innovation quite like HERITAGE Motors. For over seven decades, we have stood at the intersection of timeless craftsmanship and cutting-edge engineering, creating machines that are not merely vehicles, but rolling testaments to the art of motorcycle design.


The story of HERITAGE Motors begins in a small workshop in 1952, where our founder, James Heritage, assembled his first motorcycle by hand. That original machine, with its elegant lines and powerful engine, set the standard for everything that would follow. James understood something fundamental: a motorcycle is more than the sum of its parts. It is an extension of the rider's spirit, a companion on the open road, and a work of art that deserves to be crafted with the utmost care and attention to detail.


This philosophy of meticulous craftsmanship remains at the heart of everything we do. Each HERITAGE motorcycle begins its life in the hands of our master craftsmen, artisans who have spent years honing their skills. The frame is not simply welded; it is sculpted. The engine is not merely assembled; it is orchestrated. Every component, from the smallest bolt to the most complex mechanical system, receives the same level of attention and care that James Heritage himself would have demanded.


But tradition alone does not define us. We have always believed that true heritage is not about clinging to the past, but about building upon it. Our engineering team works tirelessly to integrate the latest technological advances into our designs, always with an eye toward enhancing the riding experience without compromising the soul of the machine. Advanced materials, precision manufacturing techniques, and state-of-the-art electronics all find their place in a HERITAGE motorcycle, but they serve the design, never dominate it.


Consider our flagship model, the Heritage Sovereign. Its silhouette is unmistakably classic, evoking the golden age of motorcycling with its flowing lines and muscular stance. Yet beneath that timeless exterior beats a thoroughly modern heart. The engine management system uses artificial intelligence to optimize performance in real-time, adapting to riding conditions and rider preferences with unprecedented sophistication. The suspension employs advanced materials that were developed for aerospace applications, providing a ride quality that would have seemed impossible just a decade ago.


This marriage of old and new extends to every aspect of our manufacturing process. We still hand-stitch our leather seats using techniques that date back to our founding, but we use computer-aided design to ensure perfect ergonomics. We still hand-paint our signature pinstripes, but we cure the paint in climate-controlled chambers that guarantee durability for decades. We still test every motorcycle on real roads, but we also simulate thousands of miles in our advanced testing facilities.


The result is a motorcycle that honors the past while embracing the future. When you sit astride a HERITAGE motorcycle, you feel the connection to seven decades of motorcycling excellence. The weight of the machine beneath you, the sound of the engine, the response of the throttle—all of these elements have been refined over generations. Yet you also experience the benefits of modern engineering: the confidence of advanced braking systems, the convenience of integrated connectivity, the efficiency of contemporary powertrains.


Our commitment to innovation extends beyond the motorcycles themselves. We have invested heavily in sustainable manufacturing practices, reducing our environmental impact while maintaining the quality standards that define our brand. We have developed new training programs to ensure that the next generation of craftsmen can carry forward our traditions. We have created a global community of HERITAGE riders who share our passion for the open road and the machines that take us there.


Looking to the future, we see endless possibilities. Electric powertrains that deliver instant torque while maintaining the character that defines a HERITAGE motorcycle. Advanced rider assistance systems that enhance safety without diminishing the joy of riding. New materials and manufacturing techniques that allow us to create even more beautiful and capable machines. But through all of these changes, one thing remains constant: our unwavering commitment to craftsmanship, quality, and the pure joy of motorcycling.


This is the legacy of HERITAGE Motors. This is what it means to build not just motorcycles, but legends. This is why, when you choose a HERITAGE motorcycle, you are not simply purchasing a vehicle—you are becoming part of a story that spans generations, a tradition of excellence that continues to evolve and inspire. Welcome to the family.`,
  pullQuotes: [
    {
      text: "A motorcycle is more than the sum of its parts. It is an extension of the rider's spirit.",
      yPosition: 0.15,
      side: 'right',
    },
    {
      text: "True heritage is not about clinging to the past, but about building upon it.",
      yPosition: 0.45,
      side: 'left',
    },
    {
      text: "When you choose a HERITAGE motorcycle, you become part of a story that spans generations.",
      yPosition: 0.75,
      side: 'right',
    },
  ],
}

// Made with Bob
