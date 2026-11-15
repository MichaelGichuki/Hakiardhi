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

export type Role = "LandOwner" | "Resgistrar" | "Admin" 