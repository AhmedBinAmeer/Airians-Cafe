import { createSlice } from "@reduxjs/toolkit";
import { todayDate } from "../../utils/dates.js";

const initialState = {
  waves: [],
  selectedWaveId: "",
  waveDate: todayDate()
};

const waveSlice = createSlice({
  name: "wave",
  initialState,
  reducers: {
    setWaves(state, action) {
      state.waves = action.payload;
      if (!state.selectedWaveId && action.payload.length) {
        state.selectedWaveId = action.payload[0]._id;
      }
    },
    setSelectedWave(state, action) {
      state.selectedWaveId = action.payload;
    },
    setWaveDate(state, action) {
      state.waveDate = action.payload;
    }
  }
});

export const { setSelectedWave, setWaveDate, setWaves } = waveSlice.actions;
export default waveSlice.reducer;
