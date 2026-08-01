import { useState } from "react";
import emailjs from "@emailjs/browser";
import "../styles/Contact.css";

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

const EMPTY_FORM = { name: "", email: "", subject: "", message: "" };

export default function Contact() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
      setStatus("error");
      return;
    }

    setStatus("sending");
    try {
      await emailjs.send(SERVICE_ID, TEMPLATE_ID, form, { publicKey: PUBLIC_KEY });
      setStatus("sent");
      setForm(EMPTY_FORM);
    } catch {
      setStatus("error");
    }
  };

  return (
    <section className="contact">
      <div className="contact-header">
        <h2>Contact Us</h2>
        <p>
          Have a project in mind or want to learn more about our services? Get in touch with us!
        </p>
      </div>

      <div className="contact-container">
        {/* Left side */}
        <div className="contact-info">
          <h3>Get In Touch</h3>

          <div className="info-item">
            <span>📧</span>
            <div>
              <h4>Email</h4>
              <p>alex_eagles@alexu.edu.eg</p>
            </div>
          </div>

          <div className="info-item">
            <span>📞</span>
            <div>
              <h4>Phone</h4>
              <p>+201016420279</p>
            </div>
          </div>
        </div>

        {/* Right side */}
        <form className="contact-form" onSubmit={handleSubmit}>
          <label htmlFor="contact-name">Name</label>
          <input
            id="contact-name"
            name="name"
            type="text"
            placeholder="Your name"
            value={form.name}
            onChange={handleChange}
            required
          />

          <label htmlFor="contact-email">Email</label>
          <input
            id="contact-email"
            name="email"
            type="email"
            placeholder="your.email@example.com"
            value={form.email}
            onChange={handleChange}
            required
          />

          <label htmlFor="contact-subject">Subject</label>
          <input
            id="contact-subject"
            name="subject"
            type="text"
            placeholder="How can we help?"
            value={form.subject}
            onChange={handleChange}
            required
          />

          <label htmlFor="contact-message">Message</label>
          <textarea
            id="contact-message"
            name="message"
            placeholder="Your message..."
            rows="5"
            value={form.message}
            onChange={handleChange}
            required
          ></textarea>

          <button type="submit" disabled={status === "sending"}>
            {status === "sending" ? "Sending..." : "Send Message"}
          </button>

          {status === "sent" && (
            <p className="contact-form-feedback contact-form-feedback--success">
              Message sent, we'll get back to you soon.
            </p>
          )}
          {status === "error" && (
            <p className="contact-form-feedback contact-form-feedback--error">
              Something went wrong. Please try again, or email us directly.
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
