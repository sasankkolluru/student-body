// Mock Firebase implementation for development

// Mock implementation for development
const mockAuth = {
  currentUser: {
    uid: 'mock-user-id',
    email: 'admin@example.com',
    displayName: 'Admin User',
    emailVerified: true,
    isAnonymous: false,
    metadata: {},
    phoneNumber: null,
    photoURL: null,
    providerData: [],
    refreshToken: 'mock-refresh-token',
    delete: async () => {},
    getIdToken: async () => 'mock-id-token',
    getIdTokenResult: async () => ({}),
    reload: async () => {},
    toJSON: () => ({}),
  },
  onAuthStateChanged: (callback: (user: any) => void) => {
    callback(mockAuth.currentUser);
    return () => {}; // Return unsubscribe function
  },
  signOut: async () => {},
} as any;

// Sample mock data
const mockNews = [
  {
    id: '1',
    title: 'Annual College Fest 2023',
    content: 'Join us for the most awaited event of the year with exciting competitions, performances, and more!',
    date: new Date('2023-10-15T10:00:00'),
    imageUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
    author: 'Admin',
    category: 'event' as const,
  },
  {
    id: '2',
    title: 'New Computer Lab Inauguration',
    content: 'The new computer lab with latest hardware and software will be inaugurated on 20th October.',
    date: new Date('2023-10-10T09:30:00'),
    author: 'Department of CSE',
    category: 'news' as const,
  },
];

const mockMatches = [
  {
    id: '1',
    team1: 'Engineering',
    team2: 'Medical',
    score1: 145,
    score2: 120,
    status: 'completed' as const,
    sport: 'Basketball',
    venue: 'Main Basketball Court',
    date: new Date('2023-10-05T15:00:00'),
  },
  {
    id: '2',
    team1: 'Science',
    team2: 'Arts',
    score1: 1,
    score2: 3,
    status: 'completed' as const,
    sport: 'Football',
    venue: 'University Stadium',
    date: new Date('2023-10-08T14:00:00'),
  },
  {
    id: '3',
    team1: 'Engineering',
    team2: 'Science',
    score1: 0,
    score2: 0,
    status: 'upcoming' as const,
    sport: 'Cricket',
    venue: 'Cricket Ground',
    time: '09:00 AM',
    date: new Date('2023-10-20T09:00:00'),
  },
];

// Enhanced mock for Firestore with sample data
export const db = {
  collection: (collectionName: string) => {
    if (collectionName === 'news') {
      return {
        doc: (id: string) => ({
          get: async () => ({
            data: () => mockNews.find(item => item.id === id),
            exists: mockNews.some(item => item.id === id),
          }),
          set: async (data: any) => {
            const index = mockNews.findIndex(item => item.id === id);
            if (index >= 0) {
              mockNews[index] = { ...data, id };
            } else {
              mockNews.push({ ...data, id });
            }
            return {};
          },
          update: async (data: any) => {
            const index = mockNews.findIndex(item => item.id === id);
            if (index >= 0) {
              mockNews[index] = { ...mockNews[index], ...data };
            }
            return {};
          },
          delete: async () => {
            const index = mockNews.findIndex(item => item.id === id);
            if (index >= 0) {
              mockNews.splice(index, 1);
            }
            return {};
          },
        }),
        add: async (data: any) => {
          const newId = (mockNews.length + 1).toString();
          const newItem = { ...data, id: newId };
          mockNews.push(newItem);
          return { id: newId };
        },
        get: async () => ({
          docs: mockNews.map(item => ({
            id: item.id,
            data: () => item,
            exists: true,
          })),
          forEach: (callback: any) => {
            mockNews.forEach(item => {
              callback({
                id: item.id,
                data: () => item,
                exists: true,
              });
            });
          },
        }),
        where: () => ({
          orderBy: () => ({
            get: async () => ({
              docs: mockNews.map(item => ({
                id: item.id,
                data: () => item,
                exists: true,
              })),
              forEach: (callback: any) => {
                mockNews.forEach(item => {
                  callback({
                    id: item.id,
                    data: () => item,
                    exists: true,
                  });
                });
              },
            }),
          }),
        }),
      };
    } else if (collectionName === 'matches') {
      return {
        doc: (id: string) => ({
          get: async () => ({
            data: () => mockMatches.find(item => item.id === id),
            exists: mockMatches.some(item => item.id === id),
          }),
          set: async (data: any) => {
            const index = mockMatches.findIndex(item => item.id === id);
            if (index >= 0) {
              mockMatches[index] = { ...data, id };
            } else {
              mockMatches.push({ ...data, id });
            }
            return {};
          },
          update: async (data: any) => {
            const index = mockMatches.findIndex(item => item.id === id);
            if (index >= 0) {
              mockMatches[index] = { ...mockMatches[index], ...data };
            }
            return {};
          },
          delete: async () => {
            const index = mockMatches.findIndex(item => item.id === id);
            if (index >= 0) {
              mockMatches.splice(index, 1);
            }
            return {};
          },
        }),
        add: async (data: any) => {
          const newId = (mockMatches.length + 1).toString();
          const newItem = { ...data, id: newId };
          mockMatches.push(newItem);
          return { id: newId };
        },
        get: async () => ({
          docs: mockMatches.map(item => ({
            id: item.id,
            data: () => item,
            exists: true,
          })),
          forEach: (callback: any) => {
            mockMatches.forEach(item => {
              callback({
                id: item.id,
                data: () => item,
                exists: true,
              });
            });
          },
        }),
        where: () => ({
          orderBy: () => ({
            get: async () => ({
              docs: mockMatches.map(item => ({
                id: item.id,
                data: () => item,
                exists: true,
              })),
              forEach: (callback: any) => {
                mockMatches.forEach(item => {
                  callback({
                    id: item.id,
                    data: () => item,
                    exists: true,
                  });
                });
              },
            }),
          }),
        }),
      };
    }
    // Default fallback for other collections
    return {
      doc: () => ({
        get: async () => ({}),
        set: async () => ({}),
        update: async () => ({}),
        delete: async () => {},
      }),
      add: async () => ({}),
      get: async () => ({
        docs: [],
        forEach: () => {},
      }),
      where: () => ({
        get: async () => ({
          docs: [],
          forEach: () => {},
        }),
      }),
    };
  },
} as any;

// Simplified mock for Storage
export const storage = {
  ref: (path: string) => ({
    put: async () => ({
      ref: { fullPath: path },
    }),
    getDownloadURL: async () => `https://example.com/${path}`,
    delete: async () => {},
  }),
} as any;

// Export mock auth
export const auth = mockAuth;

// Mock Firebase app
export const app = {
  name: '[DEFAULT]',
  options: {},
  automaticDataCollectionEnabled: false,
} as any;

export default app;
