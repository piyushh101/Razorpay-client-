import { useEffect, useState } from "react";
import { useCart } from "../cartContext";
import "./Shop.css";
import { API } from "../api";

const API = import.meta.env.VITE_API_BASE || "http://localhost:5174/api";

export default function Shop() {
  const { add } = useCart();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch(`${API}/products`)
      .then((res) => res.json())
      .then(setProducts);
  }, []);

  const handleAddToCart = (p, e) => {
    add(p);

    // clone the product image
    const img = e.currentTarget.parentNode.querySelector("img");
    if (!img) return;

    const cartIcon = document.querySelector(".cart-icon");
    if (!cartIcon) return;

    const imgClone = img.cloneNode(true);
    const rect = img.getBoundingClientRect();
    imgClone.style.position = "fixed";
    imgClone.style.top = rect.top + "px";
    imgClone.style.left = rect.left + "px";
    imgClone.style.width = rect.width + "px";
    imgClone.style.height = rect.height + "px";
    imgClone.style.transition = "all 0.7s ease-in-out";
    imgClone.style.zIndex = 9999;

    document.body.appendChild(imgClone);

    const cartRect = cartIcon.getBoundingClientRect();

    requestAnimationFrame(() => {
      imgClone.style.top = cartRect.top + "px";
      imgClone.style.left = cartRect.left + "px";
      imgClone.style.width = "20px";
      imgClone.style.height = "20px";
      imgClone.style.opacity = "0.5";
    });

    imgClone.addEventListener("transitionend", () => {
      imgClone.remove();
    });
  };

  return (
    <>
      {/* Hero Section */}
      <div className="hero">
        <div className="hero-overlay">
          <h1 className="hero-title">Welcome to My Shop</h1>
          <p className="hero-breadcrumb">Home / Shop</p>
        </div>
      </div>

      {/* Products Section */}
      <div className="page-content">
        <div className="products">
          {products.map((p) => (
            <div key={p._id} className="product-card">
              <img src={p.img} alt={p.title} className=""/>
              <h3>{p.title}</h3>
              <p>₹{(p.pricePaise / 100).toFixed(2)}</p>
              <button onClick={(e) => handleAddToCart(p, e)}>Add to Cart</button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
