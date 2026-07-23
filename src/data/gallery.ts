
export interface GalleryItem {
  id: string;
  title: string;
  category: 'SUAS 2026' | 'Manufacturing' | 'Test Flights' | 'Behind the Scenes';
  imageUrl?: string;
  videoUrl?: string;
}

export const galleryData: GalleryItem[] = [
    {
    id: '1',
    title: 'Alex Eagles 26',
    category: 'Manufacturing',
    videoUrl: 'https://www.dropbox.com/scl/fi/v6dkvop5yxjcnupibak39/Alex_Eagles_26.mp4?rlkey=4seiljj13yt08pyl317bwe8gv&st=a0msqx5h&raw=1',
  },
  {
    id: '2',
    title: 'Testing',
    category: 'SUAS 2026',
    imageUrl: 'https://res.cloudinary.com/sjdpexft/image/upload/f_auto,q_auto/IMG_8014_cm2q47.jpg',
  },
  {
    id: '3',
    title: 'Ta7ya Masr',
    category: 'Behind the Scenes',
    imageUrl: 'https://res.cloudinary.com/sjdpexft/image/upload/f_auto,q_auto/IMG_8050_foed6k.jpg',
  },
  {
    id: '4',
    title: 'First Hover Test',
    category: 'Test Flights',
    imageUrl: 'https://res.cloudinary.com/sjdpexft/image/upload/f_auto,q_auto/IMG_8021_dhkmwb',
  },
  {
    id: '5',
    title: 'Selfie Time',
    category: 'Behind the Scenes',
    imageUrl: 'https://res.cloudinary.com/sjdpexft/image/upload/f_auto,q_auto/IMG_8006_rr567s.jpg',
  },
  {
    id: '6',
    title: 'Preparing for Flight',
    category: 'Manufacturing',
    imageUrl: 'https://res.cloudinary.com/sjdpexft/image/upload/f_auto,q_auto/IMG_8415_n6xucw.jpg',
  },
  {
    id: '7',
    title: 'Pre-flight Checks',
    category: 'Behind the Scenes',
    imageUrl: 'https://res.cloudinary.com/sjdpexft/image/upload/f_auto,q_auto/IMG_8421_rcyl4z.jpg',
  },
];

export const galleryCategories = ['All', 'SUAS 2026', 'Manufacturing', 'Test Flights', 'Behind the Scenes'];