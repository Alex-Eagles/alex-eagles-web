export type Category = 'SUAS' | 'UAVC' | 'Test Flight' | 'Manufacturing' | 'Team';

export interface GalleryItem {
  id: string;
  title: string;
  imageUrl?: string;
  videoUrl?: string;
  category?: Category;
}

export const galleryData: GalleryItem[] = [
  {
    id: '1',
    title: 'Alex Eagles 26',
    videoUrl: 'https://res.cloudinary.com/sjdpexft/video/upload/q_auto,f_auto/v1785327036/web_Alex_Eagles_26_fh5dwv.mp4',
    category: 'Team',
  },
  {
    id: '2',
    title: 'Assemble Quad',
    imageUrl: 'gallery/assemble1stquaddroneinwarsha.webp',
    category: 'Manufacturing',
  },
  {
    id: '3',
    title: 'Ta7ya Masr',
    imageUrl: 'gallery/IMG_8050.webp',
    category: 'Team',
  },
  {
    id: '4',
    title: 'Quad Design',
    imageUrl: 'gallery/Design.webp',
    category: 'Manufacturing',
  },
  {
    id: '5',
    title: 'Selfie Time',
    imageUrl: '/gallery/IMG_8006.webp',
    category: 'Team',
  },
  {
    id: '6',
    title: 'Preparing for Flight',
    imageUrl: 'gallery/IMG_8415.webp',
    category: 'Test Flight',
  },
  {
    id: '7',
    title: 'Pre-flight Checks',
    imageUrl: 'gallery/IMG_8421.webp',
    category: 'Test Flight',
  },
  {
    id: '8',
    title: 'EGY',
    imageUrl: 'gallery/EGY.webp',
    category: 'Team',
  },
  {
    id: '9',
    title: 'Ghost in the Air',
    videoUrl: 'https://res.cloudinary.com/sjdpexft/video/upload/q_auto,f_auto/v1785327036/web_Video_3_V1_hdwqkk.mp4',
    category: 'UAVC',
  },
  {
    id: '10',
    title: 'Art',
    imageUrl: 'gallery/IMG02.webp',
    category: 'Team',
  },
  {
    id: '11',
    title: 'Fixed Wing',
    imageUrl: 'gallery/FixedWing.webp',
    category: 'UAVC',
  },
  {
    id: '12',
    title: 'Proud Parents Of a Baby Wing',
    imageUrl: 'gallery/IMG01.webp',
    category: 'Team',
  },
  {
    id: '13',
    title: 'Gravity Defying',
    videoUrl: 'https://res.cloudinary.com/sjdpexft/video/upload/q_auto,f_auto/v1785327036/web_Video-02_rwyubm.mp4',
    category: 'Test Flight',
  },
  {
    id: '14',
    title: 'Lady Bird',
    videoUrl: 'https://res.cloudinary.com/sjdpexft/video/upload/q_auto,f_auto/v1785326752/LadyBird_pzbd1i.mp4',
    category: 'UAVC',
  },
  {
    id: '15',
    title: 'Suas 2025',
    videoUrl: 'https://res.cloudinary.com/sjdpexft/video/upload/q_auto,f_auto/v1785326778/SuasCompetition2025_e8kdso.mp4',
    category: 'SUAS',
  },
  {
    id: '16',
    title: 'Test Drone 2025',
    videoUrl: 'https://res.cloudinary.com/sjdpexft/video/upload/q_auto,f_auto/v1785326777/TestDrone2025_imttd4.mp4',
    category: 'Test Flight',
  },
  {
    id: '17',
    title: 'Call For Members',
    videoUrl: 'https://res.cloudinary.com/sjdpexft/video/upload/q_auto,f_auto/v1785326739/CallForMembers_lpe78e.mp4',
    category: 'Team',
  },
  {
    id: '18',
    title: 'Lady Bird',
    imageUrl: 'gallery/Fixed_wing_2025_for_uavc(ladybird).webp',
    category: 'UAVC',
  },
  {
    id: '19',
    title: 'Hexa Test Drone',
    imageUrl: 'gallery/Hexa_test_drone 2026.webp',
    category: 'Test Flight',
  },
  {
    id: '20',
    title: 'Iftar 2025',
    imageUrl: 'gallery/Iftar2025.webp',
    category: 'Team',
  },
  {
    id: '21',
    title: 'Itay',
    imageUrl: 'gallery/Itay.webp',
    category: 'SUAS',
  },
  {
    id: '22',
    title: 'Orientation Suas 2025',
    imageUrl: 'gallery/Orientation_Suas2025.webp',
    category: 'Team',
  },
  {
    id: '23',
    title: 'Suas 2025 Award',
    imageUrl: 'gallery/Suas_2025_Award.webp',
    category: 'SUAS',
  },
  {
    id: '24',
    title: 'Suas 2025',
    imageUrl: 'gallery/Suas_Competition2025.webp',
    category: 'SUAS',
  },
  {
    id: '25',
    title: 'Itay Drone',
    imageUrl: 'gallery/Suas2025Drone(Itay).webp',
    category: 'SUAS',
  },
  {
    id: '26',
    title: 'Suas 2025',
    imageUrl: 'gallery/Suas2025.webp',
    category: 'SUAS',
  },
  {
    id: '27',
    title: 'َQuad Test Drone',
    imageUrl: 'gallery/test_drone.webp',
    category: 'Test Flight',
  },
  {
    id: '28',
    title: 'Uavc 2025',
    imageUrl: 'gallery/Uavc2025.webp',
    category: 'UAVC',
  },
  {
    id: '29',
    title: 'After Award Best Design Report Suas 2025',
    imageUrl: 'gallery/After_Award_BesT_Design_Report_Suas 2025.webp',
    category: 'SUAS',
  },
  {
    id: '30',
    title: 'Quad Sunset',
    imageUrl: 'gallery/onGround.webp',
    category: 'Test Flight',
  },
  {
    id: '31',
    title: 'UAVC 2026',
    imageUrl: 'gallery/UAVC2026Team.webp',
    category: 'UAVC',
  },
  {
    id: '32',
    title: 'Uavc 2026',
    imageUrl: 'gallery/UavcTeam.webp',
    category: 'Team',
  },
  {
    id: '33',
    title: '',
    imageUrl: 'gallery/wood.webp',
    category: 'Manufacturing',
  },
  {
    id: '34',
    title: 'Hexa Test Flight',
    videoUrl: 'https://res.cloudinary.com/sjdpexft/video/upload/q_auto,f_auto/v1785376560/opt_Hexa_Test_Flight_xcjiye.mp4',
    category: 'Test Flight',
  },
  {
    id: '35',
    title: '',
    videoUrl: 'https://res.cloudinary.com/sjdpexft/video/upload/q_auto,f_auto/v1785376333/opt_manufacturing_mylkui.mp4',
    category: 'Manufacturing',
  },
  {
    id: '36',
    title: 'Quad Test Flight',
    videoUrl: 'https://res.cloudinary.com/sjdpexft/video/upload/q_auto,f_auto/v1785376211/opt_opt_1st_quad_in_front_of_warsha_Test_flight_pkyx5w.mp4',
    category: 'Test Flight',
  },
  {
    id: '37',
    title: 'CNC Machining',
    videoUrl: 'https://res.cloudinary.com/sjdpexft/video/upload/q_auto,f_auto/v1785376015/opt_cnc_z6xacp.mp4',
    category: 'Manufacturing',
  },
  {
    id: '38',
    title: 'Laser Cutting Drone',
    videoUrl: 'https://res.cloudinary.com/sjdpexft/video/upload/q_auto,f_auto/v1785376006/opt_laser_cutting_drone_nig7wi.mp4',
    category: 'Manufacturing',
  },
  {
    id: '39',
    title: 'Quad Test',
    videoUrl: 'https://res.cloudinary.com/sjdpexft/video/upload/q_auto,f_auto/v1785375999/opt_team_1st_quad_in_front_of_warsha_iuemcf.mp4',
    category: 'Test Flight',
  },
  {
    id: '40',
    title: 'Working Drone Team',
    videoUrl: 'https://res.cloudinary.com/sjdpexft/video/upload/q_auto,f_auto/v1785375928/opt_working_drone_team_gp6foi.mp4',
    category: 'Manufacturing',
  },
  {
    id: '41',
    title: 'Test Flight Close-up',
    videoUrl: 'https://res.cloudinary.com/sjdpexft/video/upload/q_auto,f_auto/v1785376614/opt_TestFlightClose_xmur5n.mp4',
    category: 'Test Flight',
  },
];