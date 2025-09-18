import { useState } from "react";
import { useCart } from "../cartContext";
import "./checkout.css"; // 👈 make sure this import is here


const API = "https://razorpay-server-xghc.onrender.com/api"; // hardcoded for quick test


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

  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePay = async () => {
    if (!items.length) return alert("Cart is empty");

    const body = {
      items: items.map((x) => ({ productId: x.id, qty: x.qty })), // 👈 use id
      address: form,
    };

    try {
      const r = await fetch(`${API}/order/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await r.json();
      if (!data?.rpOrder?.id) return alert("Failed to create order");

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.rpOrder.amount,
        currency: data.rpOrder.currency,
        name: "My Shop",
        description: "Cart Checkout",
        order_id: data.rpOrder.id,
        prefill: {
          name: form.name,
          email: form.email,
          contact: form.phone,
        },
        theme: { color: "#111" },
        handler: async function (resp) {
          const verify = await fetch(`${API}/payment/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(resp),
          });
          const result = await verify.json();
          if (result.ok) {
            setSuccess(true); // ✅ trigger animation
            setTimeout(() => (window.location.href = "/"), 2000); // ✅ redirect
          } else {
            alert("❌ Payment verification failed");
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("CHECKOUT ERROR:", err);
      alert("Something went wrong. See console.");
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
      <form className="checkout-form">
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

        <button type="button" className="btn-primary" onClick={handlePay}>
          Pay Now
        </button>
      </form>
    </div>
  );
}
