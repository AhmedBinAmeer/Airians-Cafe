import { Minus, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { addToCart } from "../features/cart/cartSlice.js";
import { formatMoney } from "../utils/dates.js";

export default function MenuCard({ item }) {
  const dispatch = useDispatch();
  const [quantity, setQuantity] = useState(1);
  const [selectedExtras, setSelectedExtras] = useState([]);

  const selectedExtraObjects = useMemo(
    () => item.extras.filter((extra) => selectedExtras.includes(extra.name)),
    [item.extras, selectedExtras]
  );
  const extraTotal = selectedExtraObjects.reduce((sum, extra) => sum + extra.price, 0);

  function toggleExtra(name) {
    setSelectedExtras((current) =>
      current.includes(name) ? current.filter((entry) => entry !== name) : [...current, name]
    );
  }

  function addItem() {
    dispatch(addToCart({ menuItem: item, quantity, extras: selectedExtraObjects }));
    setQuantity(1);
    setSelectedExtras([]);
  }

  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft">
      <div className="relative h-44 food-image">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" loading="lazy" />
        ) : null}
        <div className="absolute left-3 top-3 rounded-md bg-navy-950/90 px-2 py-1 text-xs font-bold text-white">
          {item.category}
        </div>
        {!item.isInStock ? (
          <div className="absolute inset-0 grid place-items-center bg-navy-950/75 text-lg font-black text-white">
            Out of stock
          </div>
        ) : null}
      </div>

      <div className="space-y-4 p-4">
        <div>
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-black text-navy-950">{item.name}</h3>
            <span className="shrink-0 rounded-md bg-navy-50 px-2 py-1 text-sm font-black text-navy-800">
              {formatMoney(item.price)}
            </span>
          </div>
          <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">{item.description}</p>
        </div>

        {item.extras?.length ? (
          <div className="flex flex-wrap gap-2">
            {item.extras.map((extra) => {
              const active = selectedExtras.includes(extra.name);
              return (
                <button
                  key={extra.name}
                  type="button"
                  onClick={() => toggleExtra(extra.name)}
                  className={`rounded-md border px-2.5 py-1.5 text-xs font-bold transition ${
                    active
                      ? "border-navy-800 bg-navy-800 text-white"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:border-navy-300"
                  }`}
                >
                  {extra.name} +{formatMoney(extra.price)}
                </button>
              );
            })}
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-3">
          <div className="flex h-10 items-center overflow-hidden rounded-md border border-slate-200">
            <button
              type="button"
              onClick={() => setQuantity((value) => Math.max(1, value - 1))}
              className="grid h-10 w-10 place-items-center text-navy-800 hover:bg-slate-100"
              title="Decrease quantity"
            >
              <Minus size={16} />
            </button>
            <span className="grid h-10 w-10 place-items-center text-sm font-black">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((value) => value + 1)}
              className="grid h-10 w-10 place-items-center text-navy-800 hover:bg-slate-100"
              title="Increase quantity"
            >
              <Plus size={16} />
            </button>
          </div>
          <button
            type="button"
            onClick={addItem}
            disabled={!item.isInStock}
            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-md bg-saffron px-3 text-sm font-black text-navy-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
          >
            <Plus size={17} />
            Add {formatMoney((item.price + extraTotal) * quantity)}
          </button>
        </div>
      </div>
    </article>
  );
}
