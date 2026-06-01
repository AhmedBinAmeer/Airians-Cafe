import { createSlice } from "@reduxjs/toolkit";

const savedAuth = localStorage.getItem("airians_auth");
const initialState = savedAuth
  ? JSON.parse(savedAuth)
  : {
      token: null,
      user: null
    };

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(state, action) {
      state.token = action.payload.token;
      state.user = action.payload.user;
      localStorage.setItem("airians_auth", JSON.stringify(action.payload));
    },
    updateWallet(state, action) {
      if (state.user) {
        state.user.walletBalance = action.payload;
        localStorage.setItem("airians_auth", JSON.stringify({ token: state.token, user: state.user }));
      }
    },
    logout(state) {
      state.token = null;
      state.user = null;
      localStorage.removeItem("airians_auth");
    }
  }
});

export const { logout, setCredentials, updateWallet } = authSlice.actions;
export default authSlice.reducer;
