// @ts-nocheck
"use client";

import { Minus, Plus } from "lucide-react";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { addToCart } from "@/features/cart/cartSlice";
import { formatMoney } from "@/utils/dates";

export default function MenuCard({ item }) {
  const dispatch = useDispatch();
  const [quantity, setQuantity] = useState(1);

  function addItem() {
    dispatch(addToCart({ menuItem: item, quantity }));
    setQuantity(1);
  }

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 shadow-lg dark:shadow-navy-950/20 transition-transform hover:-translate-y-1 hover:shadow-xl dark:hover:shadow-navy-950/40">
      {/* Large Edge-to-Edge Image */}
      <div className="relative h-56 food-image">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" loading="lazy" />
        ) : null}
        
        {/* Dark overlay at bottom for text contrast if needed, but we'll use a badge */}
        <div className="absolute left-3 top-3 rounded bg-navy-900 px-3 py-1 text-xs font-black uppercase tracking-wider text-white shadow-md">
          {item.category}
        </div>
        
        {!item.isInStock ? (
          <div className="absolute inset-0 grid place-items-center bg-navy-950/80 text-2xl font-black uppercase tracking-widest text-white backdrop-blur-sm">
            Out of stock
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-xl font-black leading-tight text-navy-950 dark:text-white">{item.name}</h3>
            <span className="shrink-0 rounded bg-navy-50 dark:bg-navy-950 px-3 py-1 text-lg font-black text-navy-900 dark:text-saffron">
              {formatMoney(item.price)}
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400 line-clamp-2">{item.description}</p>
        </div>

        {/* Spacer to push controls to bottom */}
        <div className="mt-auto pt-4">
          <div className="flex items-center gap-3">
            {/* Chunky Quantity Selector */}
            <div className="flex h-12 items-center overflow-hidden rounded-lg border-2 border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-950">
              <button
                type="button"
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                className="grid h-12 w-10 place-items-center text-navy-900 dark:text-slate-300 transition hover:bg-slate-200 dark:hover:bg-navy-800"
                title="Decrease quantity"
              >
                <Minus size={18} strokeWidth={3} />
              </button>
              <span className="grid h-12 w-10 place-items-center text-base font-black text-navy-950 dark:text-white bg-white dark:bg-navy-900">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((value) => value + 1)}
                className="grid h-12 w-10 place-items-center text-navy-900 dark:text-slate-300 transition hover:bg-slate-200 dark:hover:bg-navy-800"
                title="Increase quantity"
              >
                <Plus size={18} strokeWidth={3} />
              </button>
            </div>

            {/* Bolder Add Button */}
            <button
              type="button"
              onClick={addItem}
              disabled={!item.isInStock}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 px-4 text-base font-black uppercase tracking-wide text-navy-950 shadow-md transition hover:scale-[1.02] hover:shadow-lg disabled:pointer-events-none disabled:opacity-50"
            >
              Add {formatMoney(item.price * quantity)}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
