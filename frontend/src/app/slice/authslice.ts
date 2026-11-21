import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import type { LoginRequest, User } from "../../types/auth.types";
import { authApi } from "../../service/auth";
import type { AxiosResponse } from "axios";


interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  status: "idle" | "loading" | "succeeded" | "failed";
  initialized: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  status: "idle",
  initialized: false,
  error: null,
};

// LOGIN
export const login = createAsyncThunk(
  "auth/login",
  async (credentials: LoginRequest, { rejectWithValue }) => {
    try {
      await authApi.signin(credentials);

      // Get the authenticated user after login.
      return await authApi.getProfile();
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Login failed"
      );
    }
  }
);

// CHECK AUTHENTICATION
export const checkAuth = createAsyncThunk(
  "auth/checkAuth",
  async (_, { rejectWithValue }) => {
    try {
      const res = await authApi.getProfile();
      return res.data;
    } catch {
      return rejectWithValue("Unauthenticated");
    }
  }
);

// LOGOUT
export const logout = createAsyncThunk(
  "auth/logout",
  async () => {
    try {
      await authApi.signout();
    } finally {
      // Clear client authentication state even if the request fails.
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    loginComplete: (state, action: PayloadAction<User>) => {
      state.initialized = true;
      state.status = "succeeded",
      state.isAuthenticated = true
      state.user = {
        email: action.payload.email,
        id: action.payload.id,
        name: action.payload.name,
        role: action.payload.role
      }
    }
  },

  extraReducers: (builder) => {
    builder

      // LOGIN
      .addCase(login.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(login.fulfilled, (state: any, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.status = "succeeded";
        state.initialized = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.user = null;
        state.isAuthenticated = false;
        state.status = "failed";
        state.error = action.payload as string;
        state.initialized = true;
      })

      // CHECK AUTH
      .addCase(checkAuth.pending, (state) => {
        state.status = "loading";
      })
      .addCase(checkAuth.fulfilled, (state: any, action: PayloadAction<User>) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.status = "succeeded";
        state.initialized = true;
      })
      .addCase(checkAuth.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.status = "idle";
        state.initialized = true;
      })

      // LOGOUT
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.status = "idle";
        state.initialized = true;
      })
      .addCase(logout.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.status = "idle";
        state.initialized = true;
      });
  },
});

export const { clearError, loginComplete } = authSlice.actions;

export default authSlice.reducer;