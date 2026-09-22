document.addEventListener("DOMContentLoaded", () => {

  const modal = document.getElementById("newsletterModal");
  const openBtn = document.getElementById("openNewsletter");
  const closeBtn = document.getElementById("nlClose");

  const form = document.getElementById("nlForm");
  const email = document.getElementById("nlEmail");

  const errorBox = document.getElementById("nlError");
  const statusBox = document.getElementById("nlStatus");
  const submitBtn = document.getElementById("nlSubmit");

  const t = window.VECTOBOL_I18N?.t || (k => k);

  if (!modal || !openBtn) return;

  function openModal() {
    modal.style.display = "flex";
  }

  function closeModal() {
    modal.style.display = "none";
  }


  function resetModal() { 
    modal.classList.remove("nl-success");
    form?.reset(); 
    if (errorBox) errorBox.textContent = ""; 
    if (statusBox) statusBox.textContent = ""; 
      submitBtn.style.display = "block";
      submitBtn.disabled = false;
      email.style.display = "block";
      submitBtn.textContent = t("newsletter_button");
        }





    openBtn.addEventListener("click", (e) => { 
      e.preventDefault(); 
      resetModal(); 
      openModal(); 
    }); 

      closeBtn?.addEventListener("click", () => { 
        resetModal(); 
        closeModal(); 
      });




  window.addEventListener("click", (e) => { 
    if (e.target === modal) { 
      resetModal(); 
      closeModal(); 
    } 
  });

  function isEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v || "");
  }

  function setError(msg) {
    if (errorBox) errorBox.textContent = msg;
    if (statusBox) statusBox.textContent = "";
  }

  function setStatus(msg) {
    if (statusBox) statusBox.textContent = msg;
    if (errorBox) errorBox.textContent = "";
  }

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const value = email?.value?.trim();

    setError("");
    setStatus("");

    if (!value) {
      setError(t("newsletter_empty"));
      return;
    }

    if (!isEmail(value)) {
      setError(t("newsletter_invalid"));
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "...";

    try {

      const res = await fetch("/wp-json/newsletter/v1/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email: value,
            lang: window.VECTOBOL_I18N?.getLang?.() || "fr"
        })
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(t("newsletter_error"));
        return;
      }

      if (data?.status === "success") {

        setStatus(t("newsletter_success"));
        modal.classList.add("nl-success");
        form.reset();

        submitBtn.style.display = "none";
        submitBtn.disabled = true;
        email.style.display = "none";

      } 
      else if (data?.code === "already") {
        setError(t("newsletter_already"));
      }
      else if (data?.code === "invalid") {
        setError(t("newsletter_invalid"));
      }
      else {
        setError(t("newsletter_error"));
      }

    } catch (err) {
      setError(t("newsletter_error"));
    }

    if (submitBtn.style.display !== "none") {
      submitBtn.disabled = false;
      submitBtn.textContent = t("newsletter_button");
    }
  });

});