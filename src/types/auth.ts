export type LoginResponse = {
  access: string;
  refresh: string;
};

export type UserMe = {
  id: number;
  username: string;
  email: string;
};
