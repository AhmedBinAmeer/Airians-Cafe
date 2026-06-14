// @ts-nocheck
import { createSlice, nanoid } from "@reduxjs/toolkit";

const initialState = {
  items: [],
  orderType: "standard",
  pickupAt: "",
  paymentMethod: "wallet",
  isOpen: false,
  notes: ""
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: {
      reducer(state, action) {
        const incoming = action.payload;
        const existing = state.items.find(
          (item) => item.menuItem === incoming.menuItem
        );

        if (existing) {
          existing.quantity += incoming.quantity;
        } else {
          state.items.push(incoming);
        }
      },
      prepare({ menuItem, quantity }) {
        return {
          payload: {
            lineId: nanoid(),
            menuItem: menuItem._id,
            name: menuItem.name,
            category: menuItem.category,
            imageUrl: menuItem.imageUrl,
            unitPrice: menuItem.price,
            quantity
          }
        };
      }
    },
    removeFromCart(state, action) {
      state.items = state.items.filter((item) => item.lineId !== action.payload);
    },
    updateQuantity(state, action) {
      const item = state.items.find((entry) => entry.lineId === action.payload.lineId);
      if (item) item.quantity = Math.max(1, action.payload.quantity);
    },
    clearCart(state) {
      state.items = [];
      state.notes = "";
    },
    setOrderType(state, action) {
      state.orderType = action.payload;
    },
    setPickupAt(state, action) {
      state.pickupAt = action.payload;
    },
    setPaymentMethod(state, action) {
      state.paymentMethod = action.payload;
    },
    setCartOpen(state, action) {
      state.isOpen = action.payload;
    },
    setNotes(state, action) {
      state.notes = action.payload;
    }
  }
});

export const { addToCart, clearCart, removeFromCart, setCartOpen, setOrderType, setPaymentMethod, setPickupAt, updateQuantity, setNotes } =
  cartSlice.actions;

export const selectCartTotal = (state) =>
  state.cart.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

export const selectCartCount = (state) => state.cart.items.reduce((sum, item) => sum + item.quantity, 0);

export default cartSlice.reducer;
