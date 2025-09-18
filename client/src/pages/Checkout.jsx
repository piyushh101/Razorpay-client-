import { useState } from "react";
import { useCart } from "../cartContext";
import "./checkout.css";

const rawBase = import.meta.env.VITE_API_BASE || "http://localhost:5174";
const API = rawBase.replace(/\/$/, "") + "/api"; // ensures /api is present

async function ensureRazorpayScript() {
  if (window.Razorpay) return true;
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    s.onload = () => resolve(true);
    s.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
    document.body.appendChild(s);
  });
}

export default function Checkout() {
  const { items, totalPaise } = useCart();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handlePay = async () => {
    if (!items.length) return alert("Cart is empty");
    if (!form.name || !form.email || !form.phone) return alert("Please fill name, email & phone");

    // prepare body, ensure productId is a string id (server expects string)
    const body = {
      items: items.map((x) => ({
        productId: x.id || x._id || (x.productId && String(x.productId)),
        qty: x.qty,
      })),
      address: form,
    };

    // basic validation: ensure all productId are strings
    const badIds = body.items.filter((it) => !it.productId || typeof it.productId !== "string");
    if (badIds.length) return alert("Cart items missing valid product ids. Check cart data.");

    setLoading(true);
    try {
      await ensureRazorpayScript();

      const resp = await fetch(`${API}/order/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`Create order failed (${resp.status}): ${text}`);
      }

      const data = await resp.json();
      const rpOrder = data?.rpOrder || data; // some servers return order directly
      if (!rpOrder?.id) {
        throw new Error("Server did not return a Razorpay order id.");
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: rpOrder.amount,
        currency: rpOrder.currency || "INR",
        name: "My Shop",
        description: "Cart Checkout",
        order_id: rpOrder.id,
        prefill: {
          name: form.name,
          email: form.email,
          contact: form.phone,
        },
        theme: { color: "#111" },
        handler: async function (resp) {
          try {
            const verifyResp = await fetch(`${API}/payment/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(resp),
            });

            if (!verifyResp.ok) {
              const text = await verifyResp.text();
              throw new Error(`Verify failed (${verifyResp.status}): ${text}`);
            }

            const result = await verifyResp.json();
            if (result.ok) {
              setSuccess(true);
              setTimeout(() => (window.location.href = "/"), 2000);
            } else {
              alert("Payment verification failed. See console.");
              console.error("verify result:", result);
            }
          } catch (err) {
            console.error("Verification error:", err);
            alert("Verification error. See console.");
          }
        },
        modal: {
          ondismiss: function () {
            console.log("Checkout dismissed by user");
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("CHECKOUT ERROR:", err);
      alert(err.message || "Something went wrong. See console.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="success-animation">
        <div className="checkmark"></div>
        <h2>Order Confirmed!</h2>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <form className="checkout-form" onSubmit={(e) => e.preventDefault()}>
        <h2>Checkout</h2>

        <label>Name</label>
        <input name="name" value={form.name} onChange={handleChange} />

        <label>Email</label>
        <input name="email" value={form.email} onChange={handleChange} />

        <label>Phone</label>
        <input name="phone" value={form.phone} onChange={handleChange} />

        <label>Line 1</label>
        <input name="line1" value={form.line1} onChange={handleChange} />

        <label>Line 2</label>
        <input name="line2" value={form.line2} onChange={handleChange} />

        <div className="row">
          <div>
            <label>City</label>
            <input name="city" value={form.city} onChange={handleChange} />
          </div>
          <div>
            <label>State</label>
            <input name="state" value={form.state} onChange={handleChange} />
          </div>
        </div>

        <label>Pincode</label>
        <input name="pincode" value={form.pincode} onChange={handleChange} />

        <h3>Total: ₹{(totalPaise / 100).toFixed(2)}</h3>

        <button type="button" className="btn-primary" onClick={handlePay} disabled={loading}>
          {loading ? "Processing..." : "Pay Now"}
        </button>
      </form>
    </div>
  );
}
