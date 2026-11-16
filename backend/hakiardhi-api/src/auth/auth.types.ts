export type SignUp = {
    email: string;
    name: string;
    role: Role;
    password: string;
}

export type Signin = {
    email: string;
    password: string
}

export interface SigninResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export type User = {
  id: string;
  email: string;
  name: string;
}

export type Role = "LandOwner" | "Resgistrar" | "Admin" 