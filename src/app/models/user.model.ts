export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

// Mock users for development
export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Alice Admin', email: 'alice@dataflow.com', role: 'admin' },
  { id: 'u2', name: 'Bob Analyst', email: 'bob@dataflow.com', role: 'user' },
  { id: 'u3', name: 'Charlie Viewer', email: 'charlie@dataflow.com', role: 'user' },
];

