export interface User {
  createdAt: Date;
  updatedAt: Date;
  id: string;
  email: string;
  avatar?: string;
  nickname: string;
  credits: number;
  role: string;
}
