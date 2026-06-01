import { createSlice, nanoid } from "@reduxjs/toolkit";

const initialState = {
  items: [],
  orderType: "standard",
  pickupAt: "",
  paymentMethod: "wallet"
};

function extrasKey(extras) {
  return [...(extras || [])].sort().join("|");
}

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: {
      reducer(state, action) {
        const incoming = action.payload;
        const existing = state.items.find(
          (item) => item.menuItem === incoming.menuItem && extrasKey(item.extras) === extrasKey(incoming.extras)
        );

        if (existing) {
          existing.quantity += incoming.quantity;
        } else {
          state.items.push(incoming);
        }
      },
      prepare({ menuItem, quantity, extras }) {
        const selectedExtras = extras || [];
        const extrasTotal = selectedExtras.reduce((sum, extra) => sum + extra.price, 0);
        return {
          payload: {
            lineId: nanoid(),
            menuItem: menuItem._id,
            name: menuItem.name,
            category: menuItem.category,
            imageUrl: menuItem.imageUrl,
            unitPrice: menuItem.price,
            extras: selectedExtras.map((extra) => extra.name),
            extrasTotal,
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
    },
    setOrderType(state, action) {
      state.orderType = action.payload;
    },
    setPickupAt(state, action) {
      state.pickupAt = action.payload;
    },
    setPaymentMethod(state, action) {
      state.paymentMethod = action.payload;
    }
  }
});

export const { addToCart, clearCart, removeFromCart, setOrderType, setPaymentMethod, setPickupAt, updateQuantity } =
  cartSlice.actions;

export const selectCartTotal = (state) =>
  state.cart.items.reduce((sum, item) => sum + (item.unitPrice + item.extrasTotal) * item.quantity, 0);

export const selectCartCount = (state) => state.cart.items.reduce((sum, item) => sum + item.quantity, 0);

export default cartSlice.reducer;
